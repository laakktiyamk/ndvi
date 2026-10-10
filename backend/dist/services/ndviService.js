"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAOI = exports.syncDates = exports.fetchAndSaveDates = exports.fetchWeather = exports.fetchAndSaveImage = exports.getSentinelDatesBySeason = exports.getSentinelDates = void 0;
const rewind_1 = __importDefault(require("@turf/rewind"));
const hash = __importStar(require("../utils/hash"));
const dateTime = __importStar(require("../utils/dateTime"));
const mongodb = __importStar(require("../mongo/mongodb"));
//import { MlData } from '../mongo/models/MlData'
const getStatistics_CDSE_1 = require("../sentinelhub/getStatistics_CDSE");
const getImage_CDSE_1 = require("../sentinelhub/getImage_CDSE");
const imageDataRef = __importStar(require("../utils/image/getImageData"));
const growingSeason_json_1 = __importDefault(require("../settings/growingSeason.json"));
const isdateingrowingseason_1 = __importDefault(require("../utils/isdateingrowingseason"));
const weatherService_1 = require("./weatherService");
const growingSeasonUtils_1 = require("../utils/growingSeasonUtils");
const geoUtils = require('../utils/geoUtils');
// ============================================================
// Concurrency limiter (REST API käyttää, Step Functions ei)
// ============================================================
function createLimit(concurrency) {
    let activeCount = 0;
    const queue = [];
    const next = () => {
        activeCount--;
        if (queue.length > 0) {
            const fn = queue.shift();
            if (fn)
                fn();
        }
    };
    return function limit(fn) {
        return new Promise((resolve, reject) => {
            const run = () => {
                activeCount++;
                fn()
                    .then((val) => { resolve(val); next(); })
                    .catch((err) => { reject(err); next(); });
            };
            if (activeCount < concurrency)
                run();
            else
                queue.push(run);
        });
    };
}
// ============================================================
// getSentinelDates — hakee statistiikat CDSE:ltä
// throwOnError: true → hakuvirhe heitetään eikä muutu tyhjäksi listaksi
// ============================================================
const getSentinelDates = async (geometry, fromTime, toTime, authToken, throwOnError = false) => {
    let stats = [];
    try {
        stats = await (0, getStatistics_CDSE_1.getStatistics)(geometry, fromTime?.toISOString() ?? '', toTime.toISOString(), authToken, throwOnError);
    }
    catch (e) {
        if (throwOnError)
            throw e;
        console.error('getSentinelDates error:', e.error ? e.error.message : e.message);
        return [];
    }
    if (!stats || stats.length === 0) {
        console.log('No statistics for geometry', fromTime, '-', toTime);
        return [];
    }
    const result = [];
    for (const stat of [...stats].reverse()) {
        if (!(0, isdateingrowingseason_1.default)(stat.interval.from, growingSeason_json_1.default))
            continue;
        const s = stat.outputs.ndvi.bands.B0.stats;
        if (s.mean >= 0.1) {
            result.push({
                generationtime: stat.interval.from,
                stats: { average: s.mean, max: s.max, min: s.min, std: s.stDev },
                sentinelid: stat.interval.from + '_' + hash.sha256(geometry),
                ndviClassPercentages: stat.ndviClassPercentages,
            });
        }
    }
    return result;
};
exports.getSentinelDates = getSentinelDates;
// ============================================================
// getSentinelDatesBySeason — ML-ajo: haetaan kasvukausi kerrallaan
// rinnakkain, ei talvia. Palauttaa myös havaintomäärät kausittain.
// Epäonnistunut kausi heittää virheen (ei tulkita "ei dataa" -tilaksi).
// ============================================================
const getSentinelDatesBySeason = async (geometry, seasons, authToken, concurrency = 3) => {
    const limit = createLimit(concurrency);
    const startTime = performance.now();
    const settled = await Promise.allSettled(seasons.map(s => limit(() => (0, exports.getSentinelDates)(geometry, s.start, s.end, authToken, true))));
    console.log("ML Dates elapsedTime (sec): ", (performance.now() - startTime) / 1000);
    const dates = [];
    const seasonCounts = [];
    const failed = [];
    settled.forEach((res, i) => {
        const year = seasons[i].start.getUTCFullYear();
        if (res.status === 'fulfilled') {
            dates.push(...res.value);
            seasonCounts.push({ year, count: res.value.length });
        }
        else {
            failed.push(year);
            console.error(`Season ${year} failed:`, res.reason?.message ?? res.reason);
        }
    });
    if (failed.length > 0) {
        throw new Error(`Statistics fetch failed for seasons: ${failed.join(', ')}`);
    }
    dates.sort((a, b) => b.generationtime.localeCompare(a.generationtime));
    return { dates, seasonCounts };
};
exports.getSentinelDatesBySeason = getSentinelDatesBySeason;
// ============================================================
// getSentinelDatesForRange — REST-polku: jakaa annetun välin
// kasvukausiin (talvia ei haeta) ja hakee ne rinnakkain.
// Jos jokin kausi epäonnistuu, palautetaan [] eikä tallenneta mitään,
// jotta syncDates yrittää samaa väliä uudelleen (ei jää aukkoa dataan).
// ============================================================
const getSentinelDatesForRange = async (geometry, fromTime, toTime, authToken) => {
    if (!fromTime)
        return (0, exports.getSentinelDates)(geometry, fromTime, toTime, authToken);
    const ranges = (0, growingSeasonUtils_1.getGrowingSeasons)(fromTime.getUTCFullYear(), toTime.getUTCFullYear())
        .map(s => ({
        start: s.start > fromTime ? s.start : fromTime,
        end: s.end < toTime ? s.end : toTime,
    }))
        .filter(r => r.start < r.end);
    if (ranges.length === 0)
        return [];
    try {
        const { dates } = await (0, exports.getSentinelDatesBySeason)(geometry, ranges, authToken);
        return dates;
    }
    catch (e) {
        console.error('getSentinelDatesForRange failed:', e.message);
        return [];
    }
};
// ============================================================
// fetchAndSaveImage — hakee yhden kuvan ja tallentaa
// Step Functions processor Lambda käyttää tätä
// ============================================================
const fetchAndSaveImage = async (item, geometry, authToken) => {
    try {
        const image = await (0, getImage_CDSE_1.getImage)(item.generationtime, geometry, authToken);
        if (!image)
            return false;
        const data = await imageDataRef.getImageData(geometry, image, { id: item.sentinelid, average: item.stats.average, max: item.stats.max, min: item.stats.min, std: item.stats.std }, item.ndviClassPercentages);
        if (data)
            await mongodb.saveImage(data);
        return !!data;
    }
    catch (e) {
        console.error('fetchAndSaveImage error:', e.message);
        return false;
    }
};
exports.fetchAndSaveImage = fetchAndSaveImage;
// ============================================================
// fetchAndSaveImages — hakee kuvat rinnakkain (REST API käyttää)
// Step Functions korvaa tämän Map-statella
// ============================================================
const fetchAndSaveImages = async (dates, geometry, authToken) => {
    const limit = createLimit(5);
    await Promise.all(dates.map(item => limit(() => (0, exports.fetchAndSaveImage)(item, geometry, authToken))));
};
// ============================================================
// fetchWeather — hakee sään rinnakkain kasvukausittain
// store: oletus Atlas (käyttäjäflow), ML-ajo antaa ML_weather-tallennuksen
// ============================================================
const fetchWeather = async (geometry, seasons, store) => {
    await Promise.all(seasons.map(({ start, end }) => (0, weatherService_1.getWeatherFromDbOrFetch)(geometry, start, end, store)));
};
exports.fetchWeather = fetchWeather;
// ============================================================
// fetchAndSaveDates — hakee statistiikat (ja kuvat jos saveImages),
// tallentaa päivät kantaan. Palauttaa haetut päivät.
// ============================================================
const fetchAndSaveDates = async (geometry, fromTime, toTime, authToken, name = '', userId = '', kasvulohkot = [], saveImages = true) => {
    const id = hash.sha256(geometry);
    const area = geoUtils.getAreaFromGeometry(geometry);
    const existing = await mongodb.getDates(id);
    if (!existing) {
        await mongodb.saveDates(id, [], geometry, area ?? 0, name, userId, kasvulohkot);
    }
    const startTime = performance.now();
    //const dates = await getSentinelDates(geometry, fromTime, toTime, authToken)
    const dates = await getSentinelDatesForRange(geometry, fromTime, toTime, authToken);
    console.log(dates.length, 'dates fetched');
    console.log("DATES elapsedTime (sec): ", (performance.now() - startTime) / 1000);
    if (dates.length === 0)
        return [];
    if (saveImages) {
        const startTime = performance.now();
        await fetchAndSaveImages(dates, geometry, authToken);
        console.log("IMAGES elapsedTime (sec): ", (performance.now() - startTime) / 1000);
    }
    const savedDates = dateTime.sortByDateTime(dates.map(({ ndviClassPercentages, ...rest }) => rest), 'generationtime', 'desc');
    const existingTimes = new Set(existing?.dates?.map((d) => d.generationtime) ?? []);
    const newDates = savedDates.filter(d => !existingTimes.has(d.generationtime));
    if (newDates.length > 0) {
        await mongodb.updateDates(id, newDates, userId);
    }
    return dates;
};
exports.fetchAndSaveDates = fetchAndSaveDates;
// ============================================================
// syncDates — tarkistaa mitä dataa on kannassa ja hakee puuttuvan.
// Yhteinen REST API:lle (saveImages: true) ja
// Step Functionsille (saveImages: false).
// ============================================================
const syncDates = async (geometry, startDate, authToken, name = '', userId = '', kasvulohkot = [], saveImages = true) => {
    const normalizedGeometry = (0, rewind_1.default)(geometry, { mutate: false });
    const id = hash.sha256(normalizedGeometry);
    const fromYear = startDate.getFullYear();
    const toYear = new Date().getFullYear();
    const seasons = (0, growingSeasonUtils_1.getGrowingSeasons)(fromYear, toYear);
    if (seasons.length === 0)
        return null;
    const sentinelFrom = seasons[0].start;
    const sentinelTo = seasons[seasons.length - 1].end;
    const existing = await mongodb.getDates(id);
    const newDates = [];
    if (!existing || !existing.dates || existing.dates.length === 0) {
        newDates.push(...await (0, exports.fetchAndSaveDates)(normalizedGeometry, sentinelFrom, sentinelTo, authToken, name, userId, kasvulohkot, saveImages));
    }
    else {
        if (existing.dates[0].generationtime < dateTime.zeroDateTime(sentinelTo)) {
            const newFrom = new Date(dateTime.addOneDay(existing.dates[0].generationtime));
            newDates.push(...await (0, exports.fetchAndSaveDates)(normalizedGeometry, newFrom, sentinelTo, authToken, name, userId, [], saveImages));
        }
        const oldestDate = existing.dates[existing.dates.length - 1]?.generationtime;
        if (oldestDate && sentinelFrom < new Date(oldestDate)) {
            newDates.push(...await (0, exports.fetchAndSaveDates)(normalizedGeometry, sentinelFrom, new Date(oldestDate), authToken, name, userId, [], saveImages));
        }
        //console.log('Dates handled in (sec): ', (performance.now() - startTime) / 1000)
        console.log('New dates fetched:', newDates.length, 'for geometry', id);
        if (kasvulohkot.length > 0 && (!existing.kasvulohkot || existing.kasvulohkot.length === 0)) {
            await mongodb.saveDates(id, existing.dates, normalizedGeometry, existing.area ?? 0, name || existing.name, userId, kasvulohkot);
        }
        else if ((name && !existing.name) || (userId && !existing.userIds?.includes(userId))) {
            await mongodb.saveDates(id, existing.dates, normalizedGeometry, existing.area ?? 0, name || existing.name, userId);
        }
    }
    return { geometry: normalizedGeometry, seasons, newDates };
};
exports.syncDates = syncDates;
// toteutetaan lambdana AWS serverless - Step Functions kutsuu tätä, ei REST API
// ============================================================
// syncMlDates — ML-ajo: hakee NDVI-tilastot kausi kerrallaan ja
// tallentaa ML_data-kokoelmaan. Ei kuvia, ei käyttäjää, ei dates-kokoelmaa.
// Jo haettua AOI:ta ei haeta uudelleen (ajon voi toistaa turvallisesti).
// ============================================================
/*
export const syncMlDates = async (
  geometry: any,
  startDate: Date,
  endDate: Date,
  authToken: string,
  batchId: string = '',
  kasvulohkot: any[] = []
): Promise<{ geometry: any; seasons: Season[] } | null> => {
  const normalizedGeometry = rewind(geometry, { mutate: false })
  const geometryHash = hash.sha256(normalizedGeometry)

  // UTC-vuodet, jotta tulos on sama paikallisesti ja Lambdassa
  const seasons = getGrowingSeasons(startDate.getUTCFullYear(), endDate.getUTCFullYear())
  if (seasons.length === 0) return null

  const existing: any = await MlData.findOne({ geometryHash }).select('dates').lean()
  const alreadyFetched = (existing?.dates?.length ?? 0) > 0

  if (!alreadyFetched) {
    const { dates, seasonCounts } = await getSentinelDatesBySeason(
      normalizedGeometry, seasons, authToken
    )
    if (dates.length === 0) return null   // ei kirjoiteta tyhjää dokumenttia

    await MlData.updateOne(
      { geometryHash },
      { $set: { geometryHash, batchId, geometry: normalizedGeometry, kasvulohkot, dates, seasonCounts } },
      { upsert: true }
    )
  }

  return { geometry: normalizedGeometry, seasons }
}*/
// ============================================================
// syncAOI — REST API orkestroija
// Estää samanaikaiset haut samalle AOI:lle (vain yhden Node-prosessin sisällä)
// ============================================================
const inFlight = new Map();
const syncAOI = (geometry, startDate, authToken, name = '', userId = '', kasvulohkot = []) => {
    const id = hash.sha256((0, rewind_1.default)(geometry, { mutate: false }));
    const running = inFlight.get(id);
    if (running)
        return running;
    const promise = (0, exports.syncDates)(geometry, startDate, authToken, name, userId, kasvulohkot, true)
        .then(async (result) => {
        if (!result)
            return null;
        const startTime = performance.now();
        await (0, exports.fetchWeather)(result.geometry, result.seasons);
        console.log("WEATHER ElapsedTime (sec): ", (performance.now() - startTime) / 1000);
        return await mongodb.getDates(hash.sha256(result.geometry));
    })
        .finally(() => inFlight.delete(id));
    inFlight.set(id, promise);
    return promise;
};
exports.syncAOI = syncAOI;
