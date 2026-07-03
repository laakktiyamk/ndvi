const area = require('@turf/area').default;
const bboxPolygon = require('@turf/bbox-polygon');
const intersect = require('@turf/intersect');
const union = require('@turf/union');

/**
 * Gets the multi-polygon geometry from a feature collection.
 * @param {Object} featureCollection - The feature collection object.
 * @returns {Object} - The multi-polygon geometry.
 */
const getFeatureCollectionMultiPolygon = (featureCollection) => {
  const { features } = featureCollection;
  let currentGeo = features[0].geometry;
  for (let feature of features.slice(1)) {
    currentGeo = appendPolygon(currentGeo, feature.geometry);
  }
  return currentGeo;
};

/**
 * Appends a polygon to the current geometry.
 * @param {Object} currentGeometry - The current geometry.
 * @param {Object} newPolygon - The new polygon to be appended.
 * @returns {Object} - The updated geometry.
 */
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
 * @param {Object} geometry - The geometry object.
 * @returns {boolean} - True if the geometry is a polygon, false otherwise.
 */
const isPolygon = (geometry) => geometry?.type === "Polygon" ?? false;

/**
 * Checks if a geometry is a multi-polygon.
 * @param {Object} geometry - The geometry object.
 * @returns {boolean} - True if the geometry is a multi-polygon, false otherwise.
 */
const isMultiPolygon = (geometry) => geometry?.type === "MultiPolygon" ?? false;

/**
 * Checks if a geometry is a bounding box.
 * @param {Object} geometry - The geometry object.
 * @returns {boolean} - True if the geometry is a bounding box, false otherwise.
 */
const isBbox = (geometry) => geometry.length === 4;

/**
 * Gets the latitude and longitude coordinates from a bounding box.
 * @param {Array} bbox - The bounding box array.
 * @returns {Array} - The array of latitude and longitude coordinates.
 */
const getLatLngFromBbox = (bbox) => {
  const [minX, minY, maxX, maxY] = bbox;
  return [
    [minY, minX],
    [maxY, maxX],
  ];
};

/**
 * Checks if all elements in an array are numbers.
 * @param {Array} arr - The array to check.
 * @returns {boolean} - True if all elements are numbers, false otherwise.
 */
const areAllNumbers = (arr) =>
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
 * @param {Array} bbox - The bounding box array.
 * @returns {boolean} - True if the bounding box is valid, false otherwise.
 */
const isValidBbox = (bbox) => bbox.length === 4 && areAllNumbers(bbox);

/**
 * Checks if a geometry is valid.
 * @param {Object} geometry - The geometry object.
 * @returns {boolean} - True if the geometry is valid, false otherwise.
 */
const isValidGeometry = (geometry) =>
  (isPolygon(geometry) || isMultiPolygon(geometry)) &&
  areAllNumbers(geometry.coordinates?.flat(Infinity));

/**
 * Gets a bounding box from coordinates.
 * @param {Array} coords - The array of coordinates.
 * @returns {Array} - The bounding box array.
 */
const getBboxFromCoords = (coords) => {
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
 * @param {Object} geometry - The geometry object.
 * @returns {number|null} - The area of the geometry, or null if the geometry is invalid.
 */
const getAreaFromGeometry = (geometry) => {
  if (!isValidGeometry(geometry)) {
    return null;
  }
  if (isBbox(geometry)) {
    return area(bboxPolygon(geometry));
  } else {
    return area(geometry);
  }
};

/**
 * Gets the area from a bounds object.
 * @param {Object} bounds - The bounds object.
 * @returns {number|null} - The area of the bounds, or null if the bounds are invalid.
 */
const getAreaFromBounds = (bounds) => {
  const geo = bounds.geometry ?? bounds.bbox;
  return getAreaFromGeometry(geo);
};

/**
 * Calculates the intersection of two geometries.
 * @param {Object} geo1 - The first geometry.
 * @param {Object} geo2 - The second geometry.
 * @returns {Object|null} - The intersection of the geometries, or null if no intersection exists.
 */
const getIntersection = (geo1, geo2) => {
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

/**
 * Gets the proper geometry from bounds.
 * @param {Object} bounds - The bounds object.
 * @returns {Object} - The geometry.
 */
const getProperGeometry = (bounds) =>
  bounds.geometry ?? bboxPolygon(bounds.bbox).geometry;

/**
 * Computes the union of two geometries.
 * @param {Object} geo1 - The first geometry.
 * @param {Object} geo2 - The second geometry.
 * @returns {Object|null} - The union of the geometries, or null if the union cannot be computed.
 */
const getUnion = (geo1, geo2) => {
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
 * @param {Object} selectedGeometry - The selected geometry.
 * @param {Object} coverGeometry - The covering geometry.
 * @returns {number} - The area cover percentage.
 */
const getAreaCoverPercentage = (selectedGeometry, coverGeometry) => {
  const intersection = getIntersection(selectedGeometry, coverGeometry);
  if (intersection === null) {
    return 0;
  }
  return (
    getAreaFromGeometry(intersection) / getAreaFromGeometry(selectedGeometry)
  );
};

/**
 * Focuses on the map element.
 */
const focusMap = () => {
  document.getElementById("map").focus();
};

/**
 * Gets the coordinates from a bounding box.
 * @param {Array} bbox - The bounding box array.
 * @returns {Array} - The array of coordinates.
 * @throws {Error} - If the bounding box is not valid.
 */
const getCoordsFromBbox = (bbox) => {
  if (bbox.length !== 4) {
    throw Error("Not valid bbox");
  }
  const polygonFromBbox = bboxPolygon(bbox);
  return polygonFromBbox.geometry.coordinates;
};

module.exports = {
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
