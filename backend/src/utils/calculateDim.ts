//import { calculateAutoDimensions } from "./bboxRatio";

const { calculateAutoDimensions }: any = require("./bboxRatio");

/**
 * Calculates the width dimension based on the given geometry and height.
 *
 * @param {any} geometry - The geometry object to calculate dimensions for.
 * @param {number | string} height - The height dimension to use for the calculation.
 * @returns {Promise<number>} - The calculated width rounded to the nearest integer.
 */
export const calculateWidth = async (geometry: any, height: number | string): Promise<number> => {
  const dimensions = calculateAutoDimensions(geometry, undefined, Number(height));
  return Math.round(dimensions[0]);
};

/**
 * Calculates the height dimension based on the given geometry and width.
 *
 * @param {any} geometry - The geometry object to calculate dimensions for.
 * @param {number | string} width - The width dimension to use for the calculation.
 * @returns {Promise<number>} - The calculated height rounded to the nearest integer.
 */
export const calculateHeight = async (geometry: any, width: number | string): Promise<number> => {
  const dimensions = calculateAutoDimensions(geometry, Number(width), undefined);
  return Math.round(dimensions[1]);
};
