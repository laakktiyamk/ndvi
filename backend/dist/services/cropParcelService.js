"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getByPeruslohkotunnus = exports.getByGeometry = void 0;
const CropParcel_1 = require("../mongo/models/CropParcel");
const intersect_1 = __importDefault(require("@turf/intersect"));
const area_1 = __importDefault(require("@turf/area"));
const helpers_1 = require("@turf/helpers");
const MIN_OVERLAP = 0.3;
const getByGeometry = async (geometry) => {
    const parcels = await CropParcel_1.CropParcel.find({ geometry: { $geoIntersects: { $geometry: geometry } } }, {
        peruslohkotunnus: 1, // väliaikainen, poistetaan kun suodatus on varmistettu
        tunnus: 1,
        lohkonumero: 1,
        kasvikoodi: 1,
        pinta_ala: 1,
        luomuviljely: 1,
        geometry: 1,
        _id: 0,
    }).lean();
    const aoi = (0, helpers_1.feature)(geometry);
    const aoiArea = (0, area_1.default)(aoi);
    return parcels
        .map((p) => {
        let overlap = 0;
        try {
            const common = (0, intersect_1.default)((0, helpers_1.featureCollection)([aoi, (0, helpers_1.feature)(p.geometry)]));
            if (common)
                overlap = (0, area_1.default)(common) / Math.min(aoiArea, (0, area_1.default)((0, helpers_1.feature)(p.geometry)));
        }
        catch {
            overlap = 0; // virheellinen geometria → ei oteta mukaan
        }
        return { ...p, overlap: Number(overlap.toFixed(2)) }; // väliaikainen
    })
        .filter((p) => p.overlap >= MIN_OVERLAP);
};
exports.getByGeometry = getByGeometry;
const getByPeruslohkotunnus = async (peruslohkotunnus) => {
    return CropParcel_1.CropParcel.find({ peruslohkotunnus }, {
        tunnus: 1,
        lohkonumero: 1,
        kasvikoodi: 1,
        pinta_ala: 1,
        luomuviljely: 1,
        geometry: 1,
        _id: 0,
    }).lean();
};
exports.getByPeruslohkotunnus = getByPeruslohkotunnus;
