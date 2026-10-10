"use strict";
//import { Jimp, intToRGBA } from "jimp";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageData = void 0;
const bbox_1 = require("@turf/bbox");
//import * as scales from "./scales";
const scales_1 = require("./scales");
/**
 * Creates a template with color percentages based on the given image.
 *
 * @param {Buffer} image - The image data buffer.
 * @returns {Promise<ScaleTemplateItem[]>} - An array of objects representing the template with color percentages.
 */
const getTemplate = async (image, classPercentages) => {
    const template = scales_1.template.map((obj, index) => ({
        ...obj,
        amount: classPercentages[index] ?? 0
    }));
    return template;
};
/**
 * Generates image data including statistics and bounding box information.
 *
 * @param {GeometryObject} geometry - The geometry object to calculate the bounding box.
 * @param {Buffer} image - The image data buffer.
 * @param {ImageStats} stats - An object containing statistics (id, average, max, min, std).
 * @returns {Promise<FinalImageData>} - An object containing image data, statistics, and scale.
 */
const getImageData = async (geometry, image, stats, classPercentages) => {
    const template = await getTemplate(image, classPercentages);
    const bbox = (0, bbox_1.bbox)(geometry);
    return {
        id: stats.id,
        average: stats.average,
        max: stats.max,
        min: stats.min,
        std: stats.std,
        image: {
            minX: bbox[0],
            minY: bbox[1],
            maxX: bbox[2],
            maxY: bbox[3],
            dataUrl: image,
        },
        scale: [...template],
    };
};
exports.getImageData = getImageData;
