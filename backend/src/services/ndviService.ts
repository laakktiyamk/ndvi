import rewind from '@turf/rewind'
import * as hash from '../utils/hash'
import * as dateTime from '../utils/dateTime'
import * as mongodb from '../mongo/mongodb'
import { getStatistics } from '../sentinelhub/getStatistics_CDSE'
import { getImage } from '../sentinelhub/getImage_CDSE'
import * as imageDataRef from '../utils/image/getImageData'
import growingSeason from '../settings/growingSeason.json'
import isDateInGrowingSeason from '../utils/isdateingrowingseason'
import { getWeatherFromDbOrFetch } from './weatherService'
import { getGrowingSeasons } from '../utils/growingSeasonUtils'

const geoUtils = require('../utils/geoUtils')

// ============================================================
// Interfaces
// ============================================================

export interface SentinelStat {
  interval: { from: string; to: string }
  outputs: {
    ndvi: {
      bands: {
        B0: {
          stats: {
            mean: number
            max: number
            min: number
            stDev: number
          }
        }
      }
    }
  }
  ndviClassPercentages: number[]
}

export interface SentinelDate {
  generationtime: string
  stats: {
    average: number
    max: number
    min: number
    std: number
  }
  sentinelid: string
  ndviClassPercentages: number[]
}

export interface Season {
  start: Date
  end: Date
}

export interface SyncDatesResult {
  geometry: any
  seasons: Season[]
  newDates: SentinelDate[]
}

// ============================================================
// Concurrency limiter (REST API käyttää, Step Functions ei)
// ============================================================

function createLimit(concurrency: number) {
  let activeCount = 0
  const queue: (() => void)[] = []

  const next = () => {
    activeCount--
    if (queue.length > 0) {
      const fn = queue.shift()
      if (fn) fn()
    }
  }

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        activeCount++
        fn()
          .then((val) => { resolve(val); next() })
          .catch((err) => { reject(err); next() })
      }
      if (activeCount < concurrency) run()
      else queue.push(run)
    })
  }
}

// ============================================================
// getSentinelDates — hakee statistiikat CDSE:ltä
// ============================================================

export const getSentinelDates = async (
  geometry: any,
  fromTime: Date | null,
  toTime: Date,
  authToken: string
): Promise<SentinelDate[]> => {
  let stats: SentinelStat[] = []

  try {
    stats = await getStatistics(
      geometry,
      fromTime?.toISOString() ?? '',
      toTime.toISOString(),
      authToken
    ) as unknown as SentinelStat[]
  } catch (e: any) {
    console.error('getSentinelDates error:', e.error ? e.error.message : e.message)
    return []
  }

  if (!stats || stats.length === 0) {
    console.log('No statistics for geometry', fromTime, '-', toTime)
    return []
  }

  const result: SentinelDate[] = []
  for (const stat of [...stats].reverse()) {
    if (!isDateInGrowingSeason(stat.interval.from, growingSeason)) continue
    const s = stat.outputs.ndvi.bands.B0.stats
    if (s.mean >= 0.1) {
      result.push({
        generationtime: stat.interval.from,
        stats: { average: s.mean, max: s.max, min: s.min, std: s.stDev },
        sentinelid: stat.interval.from + '_' + hash.sha256(geometry),
        ndviClassPercentages: stat.ndviClassPercentages,
      })
    }
  }
  return result
}

// ============================================================
// fetchAndSaveImage — hakee yhden kuvan ja tallentaa
// Step Functions processor Lambda käyttää tätä
// ============================================================

export const fetchAndSaveImage = async (
  item: SentinelDate,
  geometry: any,
  authToken: string
): Promise<boolean> => {
  try {
    const image = await getImage(item.generationtime, geometry, authToken)
    if (!image) return false
    const data = await imageDataRef.getImageData(
      geometry,
      image,
      { id: item.sentinelid, average: item.stats.average, max: item.stats.max, min: item.stats.min, std: item.stats.std },
      item.ndviClassPercentages
    )
    if (data) await mongodb.saveImage(data)
    return !!data
  } catch (e: any) {
    console.error('fetchAndSaveImage error:', e.message)
    return false
  }
}

// ============================================================
// fetchAndSaveImages — hakee kuvat rinnakkain (REST API käyttää)
// Step Functions korvaa tämän Map-statella
// ============================================================

const fetchAndSaveImages = async (
  dates: SentinelDate[],
  geometry: any,
  authToken: string
): Promise<void> => {
  const limit = createLimit(5)
  await Promise.all(
    dates.map(item => limit(() => fetchAndSaveImage(item, geometry, authToken)))
  )
}

// ============================================================
// fetchWeather — hakee sään rinnakkain kasvukausittain
// ============================================================

export const fetchWeather = async (
  geometry: any,
  seasons: Season[]
): Promise<void> => {
  await Promise.all(
    seasons.map(({ start, end }) => getWeatherFromDbOrFetch(geometry, start, end))
  )
}

// ============================================================
// fetchAndSaveDates — hakee statistiikat (ja kuvat jos saveImages),
// tallentaa päivät kantaan. Palauttaa haetut päivät.
// ============================================================

export const fetchAndSaveDates = async (
  geometry: any,
  fromTime: Date | null,
  toTime: Date,
  authToken: string,
  name: string = '',
  userId: string = '',
  kasvulohkot: any[] = [],
  saveImages: boolean = true
): Promise<SentinelDate[]> => {
  const id = hash.sha256(geometry)
  const area = geoUtils.getAreaFromGeometry(geometry)

  const existing = await mongodb.getDates(id)
  if (!existing) {
    await mongodb.saveDates(id, [], geometry, area ?? 0, name, userId, kasvulohkot)
  }

  const dates = await getSentinelDates(geometry, fromTime, toTime, authToken)
  console.log(dates.length, 'dates fetched')
  if (dates.length === 0) return []

  if (saveImages) {
    await fetchAndSaveImages(dates, geometry, authToken)
  }

  const savedDates = dateTime.sortByDateTime(
    dates.map(({ ndviClassPercentages, ...rest }) => rest),
    'generationtime',
    'desc'
  )

  const existingTimes = new Set(existing?.dates?.map((d: any) => d.generationtime) ?? [])
  const newDates = savedDates.filter(d => !existingTimes.has(d.generationtime))

  if (newDates.length > 0) {
    await mongodb.updateDates(id, newDates, userId)
  }

  return dates
}

// ============================================================
// syncDates — tarkistaa mitä dataa on kannassa ja hakee puuttuvan.
// Yhteinen REST API:lle (saveImages: true) ja
// Step Functionsille (saveImages: false).
// ============================================================

export const syncDates = async (
  geometry: any,
  startDate: Date,
  authToken: string,
  name: string = '',
  userId: string = '',
  kasvulohkot: any[] = [],
  saveImages: boolean = true
): Promise<SyncDatesResult | null> => {
  const normalizedGeometry = rewind(geometry, { mutate: false })
  const id = hash.sha256(normalizedGeometry)

  const fromYear = startDate.getFullYear()
  const toYear = new Date().getFullYear()
  const seasons = getGrowingSeasons(fromYear, toYear)

  if (seasons.length === 0) return null

  const sentinelFrom = seasons[0].start
  const sentinelTo = seasons[seasons.length - 1].end

  const existing = await mongodb.getDates(id)
  const newDates: SentinelDate[] = []

  if (!existing || !existing.dates || existing.dates.length === 0) {
    newDates.push(
      ...await fetchAndSaveDates(normalizedGeometry, sentinelFrom, sentinelTo, authToken, name, userId, kasvulohkot, saveImages)
    )
  } else {
    if (existing.dates[0].generationtime < dateTime.zeroDateTime(sentinelTo)) {
      const newFrom = new Date(dateTime.addOneDay(existing.dates[0].generationtime))
      newDates.push(
        ...await fetchAndSaveDates(normalizedGeometry, newFrom, sentinelTo, authToken, name, userId, [], saveImages)
      )
    }

    const oldestDate = existing.dates[existing.dates.length - 1]?.generationtime
    if (oldestDate && sentinelFrom < new Date(oldestDate)) {
      newDates.push(
        ...await fetchAndSaveDates(normalizedGeometry, sentinelFrom, new Date(oldestDate), authToken, name, userId, [], saveImages)
      )
    }

    if (kasvulohkot.length > 0 && (!existing.kasvulohkot || existing.kasvulohkot.length === 0)) {
      await mongodb.saveDates(id, existing.dates, normalizedGeometry, existing.area ?? 0, name || existing.name, userId, kasvulohkot)
    } else if ((name && !existing.name) || (userId && !existing.userIds?.includes(userId))) {
      await mongodb.saveDates(id, existing.dates, normalizedGeometry, existing.area ?? 0, name || existing.name, userId)
    }
  }

  return { geometry: normalizedGeometry, seasons, newDates }
}

// ============================================================
// syncAOI — REST API orkestroija
// Estää samanaikaiset haut samalle AOI:lle (vain yhden Node-prosessin sisällä)
// ============================================================

const inFlight = new Map<string, Promise<any>>()

export const syncAOI = (
  geometry: any,
  startDate: Date,
  authToken: string,
  name: string = '',
  userId: string = '',
  kasvulohkot: any[] = []
): Promise<any> => {
  const id = hash.sha256(rewind(geometry, { mutate: false }))

  const running = inFlight.get(id)
  if (running) return running

  const promise = syncDates(geometry, startDate, authToken, name, userId, kasvulohkot, true)
    .then(async (result) => {
      if (!result) return null
      await fetchWeather(result.geometry, result.seasons)
      return await mongodb.getDates(hash.sha256(result.geometry))
    })
    .finally(() => inFlight.delete(id))

  inFlight.set(id, promise)
  return promise
}