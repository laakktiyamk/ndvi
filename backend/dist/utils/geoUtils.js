"use strict";
// backend/src/utils/geoUtils.ts
// @ts-nocheck
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoordsFromBbox = exports.focusMap = exports.getAreaCoverPercentage = exports.getUnion = exports.getProperGeometry = exports.getIntersection = exports.getAreaFromBounds = exports.getAreaFromGeometry = exports.getBboxFromCoords = exports.isValidGeometry = exports.isValidBbox = exports.areAllNumbers = exports.getLatLngFromBbox = exports.isBbox = exports.isMultiPolygon = exports.isPolygon = exports.appendPolygon = exports.getFeatureCollectionMultiPolygon = void 0;
const area_1 = __importDefault(require("@turf/area"));
const bbox_polygon_1 = __importDefault(require("@turf/bbox-polygon"));
const intersect_1 = __importDefault(require("@turf/intersect"));
const union_1 = __importDefault(require("@turf/union"));
const getFeatureCollectionMultiPolygon = (featureCollection) => {
    const { features } = featureCollection;
    let currentGeo = features[0].geometry;
    for (let feature of features.slice(1)) {
        currentGeo = appendPolygon(currentGeo, feature.geometry);
    }
    return currentGeo;
};
exports.getFeatureCollectionMultiPolygon = getFeatureCollectionMultiPolygon;
const appendPolygon = (currentGeometry, newPolygon) => {
    if (isPolygon(currentGeometry)) {
        return {
            type: "MultiPolygon",
            coordinates: [currentGeometry.coordinates, newPolygon.coordinates],
        };
    }
    if (isPolygon(newPolygon)) {
        return {
            type: "MultiPolygon",
            coordinates: currentGeometry.coordinates.concat([
                newPolygon.coordinates,
            ]),
        };
    }
    return {
        type: "MultiPolygon",
        coordinates: currentGeometry.coordinates.concat(newPolygon.coordinates),
    };
};
exports.appendPolygon = appendPolygon;
const isPolygon = (geometry) => geometry?.type === "Polygon" ?? false;
exports.isPolygon = isPolygon;
const isMultiPolygon = (geometry) => geometry?.type === "MultiPolygon" ?? false;
exports.isMultiPolygon = isMultiPolygon;
const isBbox = (geometry) => geometry.length === 4;
exports.isBbox = isBbox;
const getLatLngFromBbox = (bbox) => {
    const [minX, minY, maxX, maxY] = bbox;
    return [
        [minY, minX],
        [maxY, maxX],
    ];
};
exports.getLatLngFromBbox = getLatLngFromBbox;
const areAllNumbers = (arr) => Boolean(arr?.reduce((acc, cv) => {
    if (typeof cv !== "number") {
        acc = false;
    }
    return acc;
}, true));
exports.areAllNumbers = areAllNumbers;
const isValidBbox = (bbox) => bbox.length === 4 && areAllNumbers(bbox);
exports.isValidBbox = isValidBbox;
const isValidGeometry = (geometry) => (isPolygon(geometry) || isMultiPolygon(geometry)) &&
    areAllNumbers(geometry.coordinates?.flat(Infinity));
exports.isValidGeometry = isValidGeometry;
const getBboxFromCoords = (coords) => {
    const actualCoords = coords[0];
    return [
        actualCoords[0][0],
        actualCoords[0][1],
        actualCoords[1][0],
        actualCoords[2][1],
    ];
};
exports.getBboxFromCoords = getBboxFromCoords;
const getAreaFromGeometry = (geometry) => {
    if (!isValidGeometry(geometry)) {
        return null;
    }
    if (isBbox(geometry)) {
        return (0, area_1.default)((0, bbox_polygon_1.default)(geometry));
    }
    else {
        return (0, area_1.default)(geometry);
    }
};
exports.getAreaFromGeometry = getAreaFromGeometry;
const getAreaFromBounds = (bounds) => {
    const geo = bounds.geometry ?? bounds.bbox;
    return getAreaFromGeometry(geo);
};
exports.getAreaFromBounds = getAreaFromBounds;
const getIntersection = (geo1, geo2) => {
    if (isBbox(geo1) && isBbox(geo2)) {
        return (0, intersect_1.default)((0, bbox_polygon_1.default)(geo1), (0, bbox_polygon_1.default)(geo2));
    }
    if (isBbox(geo1)) {
        return (0, intersect_1.default)((0, bbox_polygon_1.default)(geo1), geo2);
    }
    if (isBbox(geo2)) {
        return (0, intersect_1.default)(geo2, (0, bbox_polygon_1.default)(geo1));
    }
    return (0, intersect_1.default)(geo1, geo2);
};
exports.getIntersection = getIntersection;
const getProperGeometry = (bounds) => bounds.geometry ?? (0, bbox_polygon_1.default)(bounds.bbox).geometry;
exports.getProperGeometry = getProperGeometry;
const getUnion = (geo1, geo2) => {
    try {
        const res = (0, union_1.default)(geo1, geo2);
        if (res) {
            return res.geometry;
        }
        return null;
    }
    catch (err) {
        return null;
    }
};
exports.getUnion = getUnion;
const getAreaCoverPercentage = (selectedGeometry, coverGeometry) => {
    const intersection = getIntersection(selectedGeometry, coverGeometry);
    if (intersection === null) {
        return 0;
    }
    return (getAreaFromGeometry(intersection) /
        getAreaFromGeometry(selectedGeometry));
};
exports.getAreaCoverPercentage = getAreaCoverPercentage;
const focusMap = () => {
    document.getElementById("map")?.focus();
};
exports.focusMap = focusMap;
const getCoordsFromBbox = (bbox) => {
    if (bbox.length !== 4) {
        throw Error("Not valid bbox");
    }
    const polygonFromBbox = (0, bbox_polygon_1.default)(bbox);
    return polygonFromBbox.geometry.coordinates;
};
exports.getCoordsFromBbox = getCoordsFromBbox;
