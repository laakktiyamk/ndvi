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
Object.defineProperty(exports, "__esModule", { value: true });
exports.images = exports.image = exports.processAOI = void 0;
const ndviService_1 = require("../services/ndviService");
const mongodb = __importStar(require("../mongo/mongodb"));
const getTokenUserId_1 = require("../utils/getTokenUserId");
// ============================================================
// processAOI — REST API: vastaanottaa AOI:n ja päivämäärät, hakee NDVI-tilastot ja kuvat 
// ============================================================
const processAOI = async (req, res, next) => {
    const authToken = req.authToken ?? '';
    const startTime = performance.now();
    let geometry;
    try {
        geometry = typeof req.body.geometry !== 'object'
            ? JSON.parse(req.body.geometry)
            : req.body.geometry;
    }
    catch (e) {
        res.status(400).send('invalid geometry');
        return;
    }
    try {
        const data = await (0, ndviService_1.syncAOI)(geometry, new Date(req.body.start_date), authToken, req.body.name ?? '', (0, getTokenUserId_1.getUserId)(req), req.body.kasvulohkot ?? []);
        console.log('Request handled in (sec): ', (performance.now() - startTime) / 1000);
        if (data)
            res.status(200).send(data);
        else
            res.status(404).send('no data available');
    }
    catch (e) {
        if (e instanceof Error)
            console.error('processAOI error:', e.message);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.processAOI = processAOI;
// ============================================================
// Image handlers 
// ============================================================
const image = async (req, res, next) => {
    const id = req.params.sentinelid;
    const all = req.query.all;
    if (all) {
        const rawData = await mongodb.getAllImages(id);
        try {
            const data = rawData.map((item) => ({
                ...item,
                image: {
                    ...item.image,
                    dataUrl: `data:image/png;base64,${Buffer.from(item.image.dataUrl.buffer).toString('base64')}`,
                },
            }));
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
