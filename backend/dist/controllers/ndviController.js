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
exports.images = exports.image = exports.dates = exports.AOIs = void 0;
const hash = __importStar(require("../utils/hash"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const geoUtils = require("../utils/geoUtils");
const getStatistics_1 = require("../sentinelhub/getStatistics");
const imageRef = __importStar(require("../sentinelhub/getImage"));
const imageDataRef = __importStar(require("../utils/image/getImageData"));
const dateTime = __importStar(require("../utils/dateTime"));
const mongodb = __importStar(require("../mongo/mongodb"));
const growingSeason_json_1 = __importDefault(require("../settings/growingSeason.json"));
const isdateingrowingseason_1 = __importDefault(require("../utils/isdateingrowingseason"));
const weatherService_1 = require("../services/weatherService");
const rewind_1 = __importDefault(require("@turf/rewind"));
// ============================================================
// JWT helper
// ============================================================
const getUserId = (req) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token)
            return '';
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET);
        return decoded._id;
    }
    catch {
        return '';
    }
};
let globalAuthToken = null;
// ============================================================
// p-limit korvaaja (toimii CommonJS + Docker)
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
                    .then((val) => {
                    resolve(val);
                    next();
                })
                    .catch((err) => {
                    reject(err);
                    next();
                });
            };
            if (activeCount < concurrency) {
                run();
            }
            else {
                queue.push(run);
            }
        });
    };
}
// ============================================================
// Helpers
// ============================================================
const getSentinelDates = async (geometry, fromTime, toTime) => {
    let data = [];
    let stats = [];
    try {
        stats = await (0, getStatistics_1.getStatistics)(geometry, fromTime?.toISOString() ?? "", toTime.toISOString(), globalAuthToken ?? "");
    }
    catch (e) {
        console.error("#### Error fetching statistics: ", e.error ? e.error.message : e.message);
        return data;
    }
    if (stats && stats.length > 0) {
        const reversedStats = [...stats].reverse();
        for (const stat of reversedStats) {
            const statRef = stat.outputs.ndvi.bands.B0.stats;
            if (statRef.mean >= 0.1) {
                data.push({
                    generationtime: stat.interval.from,
                    stats: {
                        average: statRef.mean,
                        max: statRef.max,
                        min: statRef.min,
                        std: statRef.stDev,
                    },
                    sentinelid: stat.interval.from + "_" + hash.sha256(geometry),
                    ndviClassPercentages: stat.ndviClassPercentages,
                });
            }
        }
    }
    else {
        console.log("No data for the geometry", fromTime, " - ", toTime);
    }
    return data;
};
const getImageWithData = async (item, geometry) => {
    const image = await imageRef.getImage(item.generationtime, geometry);
    if (image) {
        const data = await imageDataRef.getImageData(geometry, image, { id: item.sentinelid, average: item.stats.average, max: item.stats.max, min: item.stats.min, std: item.stats.std }, item.ndviClassPercentages);
        return data;
    }
    return null;
};
const saveSentinelDataToMongo = async (save, geometry, fromTime, toTime, name = '', userId = '') => {
    const id = hash.sha256(geometry);
    const area = geoUtils.getAreaFromGeometry(geometry);
    let savedDates = [];
    let res = null;
    try {
        if (save) {
            res = await mongodb.saveDates(id, savedDates, geometry, area ?? 0, name, userId);
        }
        const startTime = performance.now();
        const dates = await getSentinelDates(geometry, fromTime, toTime);
        console.log(dates.length, " STATISTICS ElapsedTime (sec): ", (performance.now() - startTime) / 1000);
        if (dates.length > 0) {
            const limit = createLimit(5);
            await Promise.all(dates.map(item => limit(async () => {
                const _data = await getImageWithData(item, geometry);
                if (_data)
                    await mongodb.saveImage(_data);
            })));
            savedDates = dates.map(({ ndviClassPercentages, ...rest }) => rest);
            savedDates = dateTime.sortByDateTime(savedDates, "generationtime", "desc");
            res = await mongodb.updateDates(id, savedDates, userId);
            return res;
        }
        return false;
    }
    catch (e) {
        console.log("XXerror: ", e.message);
        return false;
    }
};
async function getDates(returnData, geometry, fromTime, toTime, name = '', userId = '') {
    const id = hash.sha256(geometry);
    let data = await mongodb.getDates(id);
    if (!data || !data.dates || data.dates.length === 0) {
        await saveSentinelDataToMongo(true, geometry, fromTime, toTime, name, userId);
    }
    else {
        if ((0, isdateingrowingseason_1.default)(toTime, growingSeason_json_1.default)) {
            if (data.dates[0].generationtime < dateTime.zeroDateTime(toTime)) {
                const newFromTime = new Date(dateTime.addOneDay(data.dates[0].generationtime));
                await saveSentinelDataToMongo(false, geometry, newFromTime, toTime, name, userId);
            }
        }
        if ((name && !data.name) || (userId && !data.userIds?.includes(userId))) {
            await mongodb.saveDates(id, data.dates, geometry, data.area ?? 0, name || data.name, userId);
        }
    }
    if (returnData) {
        return await mongodb.getDates(id);
    }
    return null;
}
// ============================================================
// Route handlers
// ============================================================
const AOIs = async (req, res, next) => {
    const data = await mongodb.getBlocks();
    res.status(200).send(data);
};
exports.AOIs = AOIs;
const dates = async (req, res, next) => {
    globalAuthToken = req.authToken;
    const startTime = performance.now();
    let geometry = null;
    try {
        const raw = typeof req.body.geometry !== "object"
            ? JSON.parse(req.body.geometry)
            : req.body.geometry;
        geometry = (0, rewind_1.default)(raw, { mutate: false });
    }
    catch (e) { }
    const fromTime = new Date(req.body.start_date);
    const toTime = new Date();
    const name = req.body.name ?? '';
    const userId = getUserId(req);
    const data = await getDates(true, geometry, fromTime, toTime, name, userId);
    console.log("Request handled in (sec): ", (performance.now() - startTime) / 1000);
    const wStart = performance.now();
    await (0, weatherService_1.getWeatherFromDbOrFetch)(geometry, fromTime, toTime);
    console.log("Weather saved in (sec): ", (performance.now() - wStart) / 1000);
    if (data) {
        res.status(200).send(data);
    }
    else {
        res.status(404).send("no data available");
    }
};
exports.dates = dates;
const image = async (req, res, next) => {
    const id = req.params.sentinelid;
    const all = req.query.all;
    if (all) {
        const rawData = await mongodb.getAllImages(id);
        try {
            const data = rawData.map((item) => {
                const updatedImage = {
                    ...item.image,
                    dataUrl: `data:image/png;base64,${Buffer.from(item.image.dataUrl.buffer).toString('base64')}`,
                };
                return { ...item, image: updatedImage };
            });
            res.status(200).send(data);
            return;
        }
        catch (e) {
            if (e instanceof Error)
                console.log(e.message);
        }
    }
    const _data = await mongodb.getImage(id);
    if (_data) {
        const dataUrl = `data:image/png;base64,${Buffer.from(_data.image.dataUrl.buffer).toString('base64')}`;
        res.status(200).send({ ..._data, image: { ..._data.image, dataUrl } });
    }
};
exports.image = image;
const images = async (req, res, next) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'ids array required' });
        return;
    }
    try {
        const rawData = await mongodb.getImagesByIds(ids);
        const imageMap = rawData.reduce((acc, item) => {
            acc[item.id] = {
                ...item,
                image: {
                    ...item.image,
                    dataUrl: `data:image/png;base64,${Buffer.from(item.image.dataUrl.buffer).toString('base64')}`,
                },
            };
            return acc;
        }, {});
        res.status(200).json(imageMap);
    }
    catch (e) {
        if (e instanceof Error)
            console.error(e.message);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.images = images;
