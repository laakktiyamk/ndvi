"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldsByBbox = exports.getFieldByLocation = void 0;
const FieldParcel_1 = require("../mongo/models/FieldParcel");
const getFieldByLocation = async (lat, lon) => {
    const point = {
        type: "Point",
        coordinates: [lon, lat],
    };
    return FieldParcel_1.FieldParcel.findOne({
        geometry: { $geoIntersects: { $geometry: point } },
    }).lean();
};
exports.getFieldByLocation = getFieldByLocation;
const getFieldsByBbox = async (minLat, maxLat, minLon, maxLon) => {
    const bbox = {
        type: "Polygon",
        coordinates: [[
                [minLon, minLat],
                [maxLon, minLat],
                [maxLon, maxLat],
                [minLon, maxLat],
                [minLon, minLat],
            ]],
    };
    return FieldParcel_1.FieldParcel.find({
        geometry: { $geoIntersects: { $geometry: bbox } },
    }).lean();
};
exports.getFieldsByBbox = getFieldsByBbox;
