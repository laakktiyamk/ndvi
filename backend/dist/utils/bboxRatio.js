"use strict";
// backend/src/utils/calculateDim.ts
// @ts-nocheck
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePixelSize = exports.calculateMaxMetersPerPixel = exports.calculateAutoDimensions = void 0;
const bbox_1 = __importDefault(require("@turf/bbox"));
const geoUtils_1 = require("./geoUtils");
/**
 * Calculates the auto dimensions for width and height based on the provided geometry, maximum width, and maximum height.
 */
const calculateAutoDimensions = (geometry, maxWidth, maxHeight) => {
    try {
        const distances = calculateMaxMetersPerPixel(geometry);
        const totX = distances[0];
        const totY = distances[1];
        const ratio = totX / totY;
        if (maxWidth !== undefined) {
            const newWidth = maxWidth;
            const newHeight = parseFloat((newWidth / ratio).toFixed(3));
            return [newWidth, newHeight];
        }
        if (maxHeight !== undefined) {
            const newHeight = maxHeight;
            const newWidth = parseFloat((newHeight * ratio).toFixed(3));
            return [newWidth, newHeight];
        }
    }
    catch (err) {
        console.error("Something went wrong while calculating dimensions", err);
    }
};
exports.calculateAutoDimensions = calculateAutoDimensions;
/**
 * Calculates the maximum meters per pixel for a given geometry.
 */
const calculateMaxMetersPerPixel = (geometry) => {
    try {
        let bbox;
        if ((0, geoUtils_1.isBbox)(geometry)) {
            bbox = geometry;
        }
        else if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
            bbox = (0, bbox_1.default)(geometry);
        }
        const xDistance1 = measure(bbox[3], bbox[0], bbox[3], bbox[2]);
        const xDistance2 = measure(bbox[1], bbox[0], bbox[1], bbox[2]);
        const yDistance = measure(bbox[3], bbox[0], bbox[1], bbox[0]);
        return [Math.max(xDistance1, xDistance2), yDistance];
    }
    catch (err) {
        console.error("Error calculating meters per pixel", err);
    }
};
exports.calculateMaxMetersPerPixel = calculateMaxMetersPerPixel;
/**
 * Calculates the pixel size based on the provided geometry and dimensions.
 */
const calculatePixelSize = (geometry, dimensions) => {
    const bboxDimensions = calculateMaxMetersPerPixel(geometry);
    return [
        bboxDimensions[0] / dimensions[0],
        bboxDimensions[1] / dimensions[1],
    ];
};
exports.calculatePixelSize = calculatePixelSize;
/**
 * Haversine formula
 */
function measure(lat1, lon1, lat2, lon2) {
    const R = 6378.137; // Radius of earth in KM
    const dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180;
    const dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d * 1000; // meters
}
