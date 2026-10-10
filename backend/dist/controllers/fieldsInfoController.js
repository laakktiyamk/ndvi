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
exports.deleteField = exports.getFields = exports.getFieldInfo = void 0;
const centroid_1 = __importDefault(require("@turf/centroid"));
const rewind_1 = __importDefault(require("@turf/rewind"));
const axios_1 = __importDefault(require("axios"));
const mongodb = __importStar(require("../mongo/mongodb"));
const getTokenUserId_1 = require("../utils/getTokenUserId");
// ── Reverse geocoding Nominatimilla ──────────────────────────
const reverseGeocode = async (lat, lon) => {
    try {
        const res = await axios_1.default.get('https://nominatim.openstreetmap.org/reverse', {
            params: { lat, lon, format: 'json', 'accept-language': 'fi' },
            headers: { 'User-Agent': 'NDVI-Monitor/1.0' },
            timeout: 5000,
        });
        const addr = res.data.address;
        const parts = [
            addr.village || addr.town || addr.city || addr.municipality,
            addr.county || addr.state,
        ].filter(Boolean);
        return parts.join(', ') || res.data.display_name;
    }
    catch {
        return '';
    }
};
// ── Ruokavirasto WFS ─────────────────────────────────────────
const fetchRuokavirastoInfo = async (lat, lon) => {
    try {
        const url = 'https://inspire.ruokavirasto.fi/geoserver/wfs';
        const res = await axios_1.default.get(url, {
            params: {
                service: 'WFS',
                version: '2.0.0',
                request: 'GetFeature',
                typeName: 'inspire:PeltolohkoRekisteri',
                outputFormat: 'application/json',
                CQL_FILTER: `INTERSECTS(geometry,POINT(${lon} ${lat}))`,
                maxFeatures: 1,
            },
            timeout: 8000,
        });
        const features = res.data?.features;
        if (features?.length > 0) {
            const props = features[0].properties;
            return {
                fieldName: props?.lohkon_nimi || props?.LOHKON_NIMI || null,
                cropType: props?.kasvilaji || props?.KASVILAJI || null,
            };
        }
        return { fieldName: null, cropType: null };
    }
    catch (err) {
        console.warn('Ruokavirasto fetch failed:', err instanceof Error ? err.message : err);
        return { fieldName: null, cropType: null };
    }
};
// ── POST /api/fields/info ─────────────────────────────────────
const getFieldInfo = async (req, res, next) => {
    console.log('req.body:', JSON.stringify(req.body).slice(0, 300));
    let geometry = null;
    try {
        const raw = typeof req.body.geometry === 'object'
            ? req.body.geometry
            : JSON.parse(req.body.geometry);
        console.log('raw.type:', raw?.type);
        console.log('raw keys:', Object.keys(raw || {}));
        geometry = (0, rewind_1.default)(raw, { mutate: false });
    }
    catch (err) {
        console.error('parse/rewind error:', err);
        res.status(400).json({ error: 'Invalid geometry' });
        return;
    }
    if (!geometry) {
        res.status(400).json({ error: 'Geometry required' });
        return;
    }
    try {
        const c = (0, centroid_1.default)({ type: 'Feature', geometry, properties: {} });
        const [lon, lat] = c.geometry.coordinates;
        const [address, ruokavirasto] = await Promise.all([
            reverseGeocode(lat, lon),
            fetchRuokavirastoInfo(lat, lon),
        ]);
        const name = ruokavirasto.fieldName || address || '';
        res.status(200).json({
            centroid: { lat, lon },
            address,
            fieldName: ruokavirasto.fieldName,
            cropType: ruokavirasto.cropType,
            name,
            geometry,
        });
    }
    catch (err) {
        console.error('getFieldInfo error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getFieldInfo = getFieldInfo;
// ── GET /api/fields ───────────────────────────────────────────
const getFields = async (req, res, next) => {
    try {
        const userId = (0, getTokenUserId_1.getUserId)(req);
        console.log('####### userId tokenista:', userId);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        console.log('Fetching fields for userId:', userId);
        const data = await mongodb.getAllDateSets(userId);
        res.status(200).json(data);
    }
    catch (err) {
        console.error('getFields error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getFields = getFields;
// DELETE /api/fields/:id
const deleteField = async (req, res, next) => {
    try {
        const userId = (0, getTokenUserId_1.getUserId)(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const id = req.params.id;
        // Tarkistetaan että pelto kuuluu käyttäjälle
        const data = await mongodb.getDates(id);
        if (!data) {
            res.status(404).json({ error: 'Field not found' });
            return;
        }
        if (!data.userIds?.includes(userId)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Poistetaan Dates-dokumentti, Images ja Weather
        await Promise.all([
            mongodb.deleteDates(id),
            mongodb.deleteImagesByHash(id),
            mongodb.deleteWeatherByHash(id),
        ]);
        res.status(200).json({ ok: true });
    }
    catch (err) {
        console.error('deleteField error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteField = deleteField;
