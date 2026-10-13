import rewind from '@turf/rewind'
import * as hash from '../utils/hash'
import * as dateTime from '../utils/dateTime'
import * as mongodb from '../mongo/mongodb'
import { MlData } from '../mongo/models/MlData'
import { getStatistics } from '../sentinelhub/getStatistics_CDSE'
import { getImage } from '../sentinelhub/getImage_CDSE'
import * as imageDataRef from '../utils/image/getImageData'
import growingSeason from '../settings/growingSeason.json'
import isDateInGrowingSeason from '../utils/isdateingrowingseason'
import { getWeatherFromDbOrFetch } from './weatherService'
import type { WeatherStore } from './weatherService'
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

export interface SeasonCount {
  year: number
  count: number
}

// ============================================================
// Concurrency limiter
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
// throwOnError: true → hakuvirhe heitetään eikä muutu tyhjäksi listaksi
// ============================================================

export const getSentinelDates = async (
  geometry: any,
  fromTime: Date | null,
  toTime: Date,
  authToken: string,
  throwOnError: boolean = false
): Promise<SentinelDate[]> => {
  let stats: SentinelStat[] = []

  try {
    stats = await getStatistics(
      geometry,
      fromTime?.toISOString() ?? '',
      toTime.toISOString(),
      authToken,
      throwOnError
    ) as unknown as SentinelStat[]
  } catch (e: any) {
    if (throwOnError) throw e
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
// getSentinelDatesBySeason — hakee annetut jaksot rinnakkain.
// Palauttaa myös havaintomäärät jaksoittain (ML käyttää).
// Epäonnistunut jakso heittää virheen (ei tulkita "ei dataa" -tilaksi).
// ============================================================

export const getSentinelDatesBySeason = async (
  geometry: any,
  seasons: Season[],
  authToken: string,
  concurrency: number = 3
): Promise<{ dates: SentinelDate[]; seasonCounts: SeasonCount[] }> => {
  const limit = createLimit(concurrency)

  const settled = await Promise.allSettled(
    seasons.map(s => limit(() => getSentinelDates(geometry, s.start, s.end, authToken, true)))
  )

  const dates: SentinelDate[] = []
  const seasonCounts: SeasonCount[] = []
  const failed: number[] = []

  settled.forEach((res, i) => {
    const year = seasons[i].start.getUTCFullYear()
    if (res.status === 'fulfilled') {
      dates.push(...res.value)
      seasonCounts.push({ year, count: res.value.length })
    } else {
      failed.push(year)
      console.error(`Season ${year} failed:`, res.reason?.message ?? res.reason)
    }
  })

  if (failed.length > 0) {
    throw new Error(`Statistics fetch failed for seasons: ${failed.join(', ')}`)
  }

  dates.sort((a, b) => b.generationtime.localeCompare(a.generationtime))
  return { dates, seasonCounts }
}

// ============================================================
// getSentinelDatesForRange — REST-polku: jakaa annetun välin
// kasvukausiin (talvia ei haeta) ja hakee ne rinnakkain.
// Jos jokin kausi epäonnistuu, palautetaan [] eikä tallenneta mitään,
// jotta syncDates yrittää samaa väliä uudelleen (ei jää aukkoa dataan).
// ============================================================

const getSentinelDatesForRange = async (
  geometry: any,
  fromTime: Date | null,
  toTime: Date,
  authToken: string
): Promise<SentinelDate[]> => {
  if (!fromTime) return getSentinelDates(geometry, fromTime, toTime, authToken)

  const ranges: Season[] = getGrowingSeasons(fromTime.getUTCFullYear(), toTime.getUTCFullYear())
    .map(s => ({
      start: s.start > fromTime ? s.start : fromTime,
      end:   s.end   < toTime   ? s.end   : toTime,
    }))
    .filter(r => r.start < r.end)

  if (ranges.length === 0) return []

  try {
    const { dates } = await getSentinelDatesBySeason(geometry, ranges, authToken)
    return dates
  } catch (e: any) {
    console.error('getSentinelDatesForRange failed:', e.message)
    return []
  }
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
): Promise<SentinelDate[]> => {
  const limit = createLimit(5)
  const results = await Promise.all(
    dates.map(item => limit(() => fetchAndSaveImage(item, geometry, authToken)))
  )
  return dates.filter((_, i) => results[i])
}

// ============================================================
// fetchWeather — hakee sään rinnakkain kasvukausittain
// store: oletus Atlas (käyttäjäflow), ML-ajo antaa ML_weather-tallennuksen
// ============================================================

export const fetchWeather = async (
  geometry: any,
  seasons: Season[],
  store?: WeatherStore
): Promise<void> => {
  await Promise.all(
    seasons.map(({ start, end }) => getWeatherFromDbOrFetch(geometry, start, end, store))
  )
}

// ============================================================
// fetchAndSaveDates — hakee statistiikat (ja kuvat jos saveImages),
// tallentaa päivät kantaan. Palauttaa haetut päivät.
// ============================================================

export const fetchAndSaveDates = async (
  geometry: any,
  fromTime: Date,
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

  const dates = await getSentinelDatesForRange(geometry, fromTime, toTime, authToken)
  console.log(dates.length, 'dates fetched')
  if (dates.length === 0) return []

  // MUUTOS: tallennetaan vain päivämäärät, joiden kuva onnistui
  let datesToSave: SentinelDate[] = dates
  if (saveImages) {
    datesToSave = await fetchAndSaveImages(dates, geometry, authToken)
  }

  const savedDates = dateTime.sortByDateTime(
    datesToSave.map(({ ndviClassPercentages, ...rest }) => rest),   // MUUTOS: dates -> datesToSave
    'generationtime',
    'desc'
  )

  const existingTimes = new Set(existing?.dates?.map((d: any) => d.generationtime) ?? [])
  const newDates = savedDates.filter(d => !existingTimes.has(d.generationtime))

  if (newDates.length > 0) {
    await mongodb.updateDates(id, newDates, userId)
  }

  return datesToSave   // palautetaan vain onnistuneet
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
// syncMlDates — ML-ajo: hakee NDVI-tilastot kausi kerrallaan ja
// tallentaa ML_data-kokoelmaan. Ei kuvia, ei käyttäjää, ei dates-kokoelmaa.
// Jo haettua AOI:ta ei haeta uudelleen (ajon voi toistaa turvallisesti).
// ============================================================

export const syncMlDates = async (
  geometry: any,
  startDate: Date,
  endDate: Date,
  authToken: string,
  batchId: string = '',
  kasvulohkot: any[] = [],
  meta: { peruslohkotunnus?: string; vuosi?: string; pinta_ala?: number } = {}
): Promise<{ geometry: any; seasons: Season[] } | null> => {
  const normalizedGeometry = rewind(geometry, { mutate: false })
  const geometryHash = hash.sha256(normalizedGeometry)

  // UTC-vuodet, jotta tulos on sama paikallisesti ja Lambdassa
  const seasons = getGrowingSeasons(startDate.getUTCFullYear(), endDate.getUTCFullYear())
  if (seasons.length === 0) return null

  console.log('syncMlDates: findOne')
  const existing: any = await MlData.findOne({ geometryHash }).select('dates').lean()
  console.log('syncMlDates: findOne done', existing?.dates?.length ?? 0)
  const alreadyFetched = (existing?.dates?.length ?? 0) > 0

  if (!alreadyFetched) {
    console.log('syncMlDates: stats')
    const { dates, seasonCounts } = await getSentinelDatesBySeason(
      normalizedGeometry, seasons, authToken
    )
    console.log('syncMlDates: stats done', dates.length)
    if (dates.length === 0) return null   // ei kirjoiteta tyhjää dokumenttia

    await MlData.updateOne(
      { geometryHash },
      { $set: { geometryHash, batchId, geometry: normalizedGeometry, kasvulohkot, dates, seasonCounts, ...meta } },
      { upsert: true }
    )
  }

  return { geometry: normalizedGeometry, seasons }
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