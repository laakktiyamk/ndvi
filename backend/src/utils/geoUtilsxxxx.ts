const area = require('@turf/area');
const bboxPolygon = require('@turf/bbox-polygon');
const intersect = require('@turf/intersect');
const union = require('@turf/union');
// Tuodaan tarvittavat GeoJSON-tyypit Turfista/TypeScriptistä
//import { Polygon, MultiPolygon, FeatureCollection } from '@turf/turf';
//const { Polygon, MultiPolygon, FeatureCollection } = require('@turf/turf');

type Polygon = any;
type MultiPolygon = any;
type FeatureCollection = any;

/**
 * Gets the multi-polygon geometry from a feature collection.
 */
export const getFeatureCollectionMultiPolygon = (featureCollection: FeatureCollection): any => {
  const { features } = featureCollection;
  let currentGeo = features[0].geometry;
  for (let feature of features.slice(1)) {
    currentGeo = appendPolygon(currentGeo, feature.geometry);
  }
  return currentGeo;
};

/**
 * Appends a polygon to the current geometry.
 */
export const appendPolygon = (currentGeometry: any, newPolygon: any): MultiPolygon => {
  if (isPolygon(currentGeometry)) {
    return {
      type: "MultiPolygon",
      coordinates: [currentGeometry.coordinates, newPolygon.coordinates],
    };
  }
  if (isPolygon(newPolygon)) {
    return {
      type: "MultiPolygon",
      coordinates: currentGeometry.coordinates.concat([newPolygon.coordinates]),
    };
  }
  return {
    type: "MultiPolygon",
    coordinates: currentGeometry.coordinates.concat(newPolygon.coordinates),
  };
};

/**
 * Checks if a geometry is a polygon.
 */
export const isPolygon = (geometry: any): boolean => geometry?.type === "Polygon";

/**
 * Checks if a geometry is a multi-polygon.
 */
export const isMultiPolygon = (geometry: any): boolean => geometry?.type === "MultiPolygon";

/**
 * Checks if a geometry is a bounding box.
 */
export const isBbox = (geometry: any): boolean => Array.isArray(geometry) && geometry.length === 4;

/**
 * Gets the latitude and longitude coordinates from a bounding box.
 */
export const getLatLngFromBbox = (bbox: number[]): number[][] => {
  const [minX, minY, maxX, maxY] = bbox;
  return [
    [minY, minX],
    [maxY, maxX],
  ];
};

/**
 * Checks if all elements in an array are numbers.
 */
export const areAllNumbers = (arr: any[]): boolean =>
  Boolean(
    arr?.reduce((acc, cv) => {
      if (typeof cv !== "number") {
        acc = false;
      }
      return acc;
    }, true)
  );

/**
 * Checks if a bounding box is valid.
 */
export const isValidBbox = (bbox: number[]): boolean => bbox.length === 4 && areAllNumbers(bbox);

/**
 * Checks if a geometry is valid.
 */
export const isValidGeometry = (geometry: any): boolean =>
  (isPolygon(geometry) || isMultiPolygon(geometry)) &&
  areAllNumbers(geometry.coordinates?.flat(Infinity));

/**
 * Gets a bounding box from coordinates.
 */
export const getBboxFromCoords = (coords: number[][][]): number[] => {
  const actualCoords = coords[0];
  return [
    actualCoords[0][0],
    actualCoords[0][1],
    actualCoords[1][0],
    actualCoords[2][1],
  ];
};

/**
 * Gets the area from a geometry.
 */
export const getAreaFromGeometry = (geometry: any): number | null => {
  if (!isValidGeometry(geometry)) {
    return null;
  }
  if (isBbox(geometry)) {
    return area(bboxPolygon(geometry as any));
  } else {
    return area(geometry);
  }
};

/**
 * Gets the area from a bounds object.
 */
export const getAreaFromBounds = (bounds: any): number | null => {
  const geo = bounds.geometry ?? bounds.bbox;
  return getAreaFromGeometry(geo);
};

/**
 * Calculates the intersection of two geometries.
 */
export const getIntersection = (geo1: any, geo2: any): any => {
  if (isBbox(geo1) && isBbox(geo2)) {
    return intersect(bboxPolygon(geo1), bboxPolygon(geo2));
  }
  if (isBbox(geo1)) {
    return intersect(bboxPolygon(geo1), geo2);
  }
  if (isBbox(geo2)) {
    return intersect(geo1, bboxPolygon(geo2)); // Korjattu looginen typo geo1:n ja geo2:n kohdalla
  }
  return intersect(geo1, geo2);
};

/**
 * Gets the proper geometry from bounds.
 */
export const getProperGeometry = (bounds: any): any =>
  bounds.geometry ?? bboxPolygon(bounds.bbox).geometry;

/**
 * Computes the union of two geometries.
 */
export const getUnion = (geo1: any, geo2: any): any => {
  try {
    const res = union(geo1, geo2);
    if (res) {
      return res.geometry;
    }
    return null;
  } catch (err) {
    return null;
  }
};

/**
 * Calculates the area cover percentage of one geometry over another.
 */
/*
export const getAreaCoverPercentage = (selectedGeometry: any, coverGeometry: any): number => {
  const intersection = getIntersection(selectedGeometry, coverGeometry);
  if (intersection === null) {
    return 0;
  }
  const selectedArea = getAreaFromGeometry(selectedGeometry);
  if (!selectedArea) return 0;
  
  return getAreaFromGeometry(intersection) / selectedArea;
};*/

/**
 * Focuses on the map element.
 */
export const focusMap = (): void => {
  if (typeof document !== "undefined") {
    document.getElementById("map")?.focus();
  }
};

/**
 * Gets the coordinates from a bounding box.
 */
export const getCoordsFromBbox = (bbox: number[]): number[][][] => {
  if (bbox.length !== 4) {
    throw new Error("Not valid bbox");
  }
  const polygonFromBbox = bboxPolygon(bbox as any);
  return polygonFromBbox.geometry.coordinates;
};
