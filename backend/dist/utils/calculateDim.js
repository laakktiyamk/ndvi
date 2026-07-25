"use strict";
//import { calculateAutoDimensions } from "./bboxRatio";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHeight = exports.calculateWidth = void 0;
const { calculateAutoDimensions } = require("./bboxRatio");
/**
 * Calculates the width dimension based on the given geometry and height.
 *
 * @param {any} geometry - The geometry object to calculate dimensions for.
 * @param {number | string} height - The height dimension to use for the calculation.
 * @returns {Promise<number>} - The calculated width rounded to the nearest integer.
 */
const calculateWidth = async (geometry, height) => {
    const dimensions = calculateAutoDimensions(geometry, undefined, Number(height));
    return Math.round(dimensions[0]);
};
exports.calculateWidth = calculateWidth;
/**
 * Calculates the height dimension based on the given geometry and width.
 *
 * @param {any} geometry - The geometry object to calculate dimensions for.
 * @param {number | string} width - The width dimension to use for the calculation.
 * @returns {Promise<number>} - The calculated height rounded to the nearest integer.
 */
const calculateHeight = async (geometry, width) => {
    const dimensions = calculateAutoDimensions(geometry, Number(width), undefined);
    return Math.round(dimensions[1]);
};
exports.calculateHeight = calculateHeight;
