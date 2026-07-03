import convertToBbox from '@turf/bbox';

import { isBbox } from './geoUtils';

/**
 * Calculates the auto dimensions for width and height based on the provided geometry, maximum width, and maximum height.
 * @param {any} geometry - The geometry object or bbox array.
 * @param {number} [maxWidth] - The maximum width.
 * @param {number} [maxHeight] - The maximum height.
 * @returns {number[]} An array containing the calculated width and height [width, height].
 */
export const calculateAutoDimensions = (
  geometry: any, 
  maxWidth?: number, 
  maxHeight?: number
): [number, number] => {
  try {
    const distances = calculateMaxMetersPerPixel(geometry);
    const totX = distances[0];
    const totY = distances[1];
    
    let newWidth: number;
    let newHeight: number;
    const ratio = totX / totY;

    if (maxWidth !== undefined) {
      newWidth = maxWidth;
      newHeight = parseFloat((newWidth / ratio).toFixed(3));
      return [newWidth, newHeight];
    } else if (maxHeight !== undefined) {
      newHeight = maxHeight;
      newWidth = parseFloat((newHeight * ratio).toFixed(3));
      return [newWidth, newHeight];
    }
    
    // Fallback if neither maxWidth nor maxHeight is provided
    return [0, 0];
  } catch (err) {
    console.error('Something went wrong while calculating dimensions', err);
    return [0, 0];
  }
};

/**
 * Calculates the maximum meters per pixel for a given geometry.
 * @param {any} geometry - The geometry object or bbox array.
 * @returns {number[]} An array containing the maximum x distance and y distance in meters per pixel.
 */
export const calculateMaxMetersPerPixel = (geometry: any): [number, number] => {
  try {
    let bbox: number[] = [];

    if (isBbox(geometry)) {
      bbox = geometry;
    } else if (geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon') {
      bbox = convertToBbox(geometry);
    }

    if (!bbox || bbox.length !== 4) {
      throw new Error("Invalid bounding box generated or provided");
    }

    const xDistance1 = measure(bbox[3], bbox[0], bbox[3], bbox[2]);
    const xDistance2 = measure(bbox[1], bbox[0], bbox[1], bbox[2]);
    const yDistance = measure(bbox[3], bbox[0], bbox[1], bbox[0]);

    return [Math.max(xDistance1, xDistance2), yDistance];
  } catch (err) {
    console.error('Error calculating meters per pixel', err);
    return;
  }
};

/**
 * Calculates the pixel size based on the provided geometry and dimensions.
 * @param {any} geometry - The geometry object or bbox array.
 * @param {number[]} dimensions - An array containing the width and height [width, height].
 * @returns {number[]} An array containing the pixel size for width and height.
 */
export const calculatePixelSize = (geometry: any, dimensions: [number, number]): [number, number] => {
  const bboxDimensions = calculateMaxMetersPerPixel(geometry);
  return [bboxDimensions[0] / dimensions[0], bboxDimensions[1] / dimensions[1]];
};

/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 */
function measure(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6378.137; // Radius of earth in KM
  const dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180;
  const dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d * 1000; // meters
}
