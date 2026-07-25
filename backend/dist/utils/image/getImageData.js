"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageData = void 0;
const jimp_1 = require("jimp");
const bbox_1 = require("@turf/bbox");
//import * as scales from "./scales";
const scales_1 = require("./scales");
/**
 * Processes the response to extract pixel data and calculate color percentages.
 *
 * @param {Buffer} response - The image data buffer.
 * @param {string[]} scaleColors - An array of scale color strings.
 * @returns {Promise<ColorItem[]>} - An array of objects containing colors and their respective percentages.
 */
const getPixelData = async (response, scaleColors) => {
    /**
     * Reads the image and extracts the RGBA values for each pixel.
     */
    async function getRGBArray(imgBuffer) {
        try {
            const image = await jimp_1.Jimp.read(imgBuffer);
            const width = image.bitmap.width;
            const height = image.bitmap.height;
            let rgbArray = [];
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const { r, g, b, a } = (0, jimp_1.intToRGBA)(image.getPixelColor(x, y));
                    rgbArray.push([r, g, b, a]);
                }
            }
            // Remove transparent pixels (out of figure area)
            return rgbArray.filter((item) => item[3] !== 0);
        }
        catch (err) {
            console.error(err);
            return [];
        }
    }
    const rgbArray = await getRGBArray(response);
    /**
     * Gets unique pixel colors from the image.
     */
    function getUniquePixels(image) {
        return image.reduce((unique, color) => {
            if (!unique.some((c) => c.toString() === color.toString())) {
                unique.push(color);
            }
            return unique;
        }, []);
    }
    const uniquePixels = getUniquePixels(rgbArray);
    /**
     * Counts the number of occurrences of a specific color.
     */
    function getCounts(colors, pixel) {
        return colors.filter((item) => item.toString() === pixel.toString());
    }
    const counts = uniquePixels.map((pixel) => {
        return getCounts(rgbArray, pixel).length;
    });
    let greenColorStr = scaleColors[scaleColors.length - 1];
    const notGreenColors = [...scaleColors];
    notGreenColors.pop();
    /**
     * Converts an RGBA array to an RGB string.
     */
    function getRgbString(color) {
        return `rgb(${color.slice(0, 3).toString()})`;
    }
    const valuesString = greenColorStr.substring(4, greenColorStr.length - 1);
    const values = valuesString.split(",").map(Number);
    const greenColor = [...values, 255];
    let greenCount = 0;
    let res = [];
    for (let i = 0; i < uniquePixels.length; i++) {
        const formattedColorString = getRgbString(uniquePixels[i]).replace(/\s*,\s*/g, ", ");
        if (!notGreenColors.includes(formattedColorString)) {
            greenCount += counts[i];
        }
        else {
            res = [...res, { color: uniquePixels[i], amount: counts[i] }];
        }
    }
    if (greenCount > 0)
        res = [...res, { color: greenColor, amount: greenCount }];
    let sum = res.reduce((a, b) => a + b.amount, 0);
    const percentages = res.map((item) => {
        // TypeScript safe check for objects instead of comparing item directly to number 0
        if (item && item.amount !== 0) {
            return Math.round((item.amount / sum) * 100);
        }
        else {
            return 0;
        }
    });
    sum = percentages.reduce((a, b) => a + b, 0);
    const error = 100 - sum;
    if (error !== 0) {
        if (error > 0) {
            const min = Math.min(...percentages);
            const minIndex = percentages.indexOf(min);
            percentages[minIndex] += 1;
        }
        else {
            const max = Math.max(...percentages);
            const maxIndex = percentages.indexOf(max);
            percentages[maxIndex] -= 1;
        }
    }
    const pixColors = res.map((item) => item.color);
    let tmp = [];
    for (let i = 0; i < pixColors.length; i++) {
        tmp = [...tmp, { color: pixColors[i], amount: percentages[i] }];
    }
    return tmp;
};
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
    // Shallow copy of scales template
    //const template: ScaleTemplateItem[] = (scales as any).template.map((obj: any) => ({ ...obj }));
    //console.log("______________________ template: ", JSON.stringify(template));
    //import { template as scaleTemplate } from './scales';
    /*
    const template = scaleTemplate.map((obj, index) => ({
      ...obj,
      amount: classPercentages[index] ?? 0
    }));
    */
    /*
    const scaleColors = template.map((obj) => obj.color);
  
    const tmp = await getPixelData(image, scaleColors);
  
    console.log("ööö getTemplate tmp: ", JSON.stringify(tmp));
  
    for (let i = 0; i < tmp.length; i++) {
      for (let j = 0; j < template.length; j++) {
        if (
          template[j].color.toString().replace(/ /g, "") ===
          `rgb(${tmp[i].color.slice(0, 3).toString()})`
        ) {
          template[j].amount = tmp[i].amount;
          break;
        }
      }
    }*/
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
