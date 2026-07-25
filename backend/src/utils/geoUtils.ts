// backend/src/utils/geoUtils.ts
// @ts-nocheck

import area from "@turf/area";
import bboxPolygon from "@turf/bbox-polygon";
import intersect from "@turf/intersect";
import union from "@turf/union";

const getFeatureCollectionMultiPolygon = (featureCollection: any) => {
  const { features } = featureCollection;
  let currentGeo = features[0].geometry;
  for (let feature of features.slice(1)) {
    currentGeo = appendPolygon(currentGeo, feature.geometry);
  }
  return currentGeo;
};

const appendPolygon = (currentGeometry: any, newPolygon: any) => {
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
    coordinates: currentGeometry.coordinates.concat(
      newPolygon.coordinates
    ),
  };
};

const isPolygon = (geometry: any) =>
  geometry?.type === "Polygon" ?? false;

const isMultiPolygon = (geometry: any) =>
  geometry?.type === "MultiPolygon" ?? false;

const isBbox = (geometry: any) => geometry.length === 4;

const getLatLngFromBbox = (bbox: number[]) => {
  const [minX, minY, maxX, maxY] = bbox;
  return [
    [minY, minX],
    [maxY, maxX],
  ];
};

const areAllNumbers = (arr: any[]) =>
  Boolean(
    arr?.reduce((acc, cv) => {
      if (typeof cv !== "number") {
        acc = false;
      }
      return acc;
    }, true)
  );

const isValidBbox = (bbox: number[]) =>
  bbox.length === 4 && areAllNumbers(bbox);

const isValidGeometry = (geometry: any) =>
  (isPolygon(geometry) || isMultiPolygon(geometry)) &&
  areAllNumbers(geometry.coordinates?.flat(Infinity));

const getBboxFromCoords = (coords: any[]) => {
  const actualCoords = coords[0];
  return [
    actualCoords[0][0],
    actualCoords[0][1],
    actualCoords[1][0],
    actualCoords[2][1],
  ];
};

const getAreaFromGeometry = (geometry: any) => {
  if (!isValidGeometry(geometry)) {
    return null;
  }
  if (isBbox(geometry)) {
    return area(bboxPolygon(geometry));
  } else {
    return area(geometry);
  }
};

const getAreaFromBounds = (bounds: any) => {
  const geo = bounds.geometry ?? bounds.bbox;
  return getAreaFromGeometry(geo);
};

const getIntersection = (geo1: any, geo2: any) => {
  if (isBbox(geo1) && isBbox(geo2)) {
    return intersect(bboxPolygon(geo1), bboxPolygon(geo2));
  }
  if (isBbox(geo1)) {
    return intersect(bboxPolygon(geo1), geo2);
  }
  if (isBbox(geo2)) {
    return intersect(geo2, bboxPolygon(geo1));
  }
  return intersect(geo1, geo2);
};

const getProperGeometry = (bounds: any) =>
  bounds.geometry ?? bboxPolygon(bounds.bbox).geometry;

const getUnion = (geo1: any, geo2: any) => {
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

const getAreaCoverPercentage = (
  selectedGeometry: any,
  coverGeometry: any
) => {
  const intersection = getIntersection(
    selectedGeometry,
    coverGeometry
  );
  if (intersection === null) {
    return 0;
  }
  return (
    getAreaFromGeometry(intersection) /
    getAreaFromGeometry(selectedGeometry)
  );
};

const focusMap = () => {
  document.getElementById("map")?.focus();
};

const getCoordsFromBbox = (bbox: number[]) => {
  if (bbox.length !== 4) {
    throw Error("Not valid bbox");
  }
  const polygonFromBbox = bboxPolygon(bbox);
  return polygonFromBbox.geometry.coordinates;
};

export {
  getFeatureCollectionMultiPolygon,
  appendPolygon,
  isPolygon,
  isMultiPolygon,
  isBbox,
  getLatLngFromBbox,
  areAllNumbers,
  isValidBbox,
  isValidGeometry,
  getBboxFromCoords,
  getAreaFromGeometry,
  getAreaFromBounds,
  getIntersection,
  getProperGeometry,
  getUnion,
  getAreaCoverPercentage,
  focusMap,
  getCoordsFromBbox,
};
