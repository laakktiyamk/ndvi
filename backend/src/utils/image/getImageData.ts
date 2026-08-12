//import { Jimp, intToRGBA } from "jimp";


import { bbox as get_bounding_box } from "@turf/bbox";
//import * as scales from "./scales";

import { ScaleItem, template as scaleTemplate } from "./scales";

// Interfaces for color structures and stats
interface ColorItem {
  color: number[];
  amount: number;
}

interface ScaleTemplateItem {
  color: string;
  amount?: number;
  [key: string]: any; // Allows other dynamic properties from scales.ts
}

interface GeometryObject {
  type: string;
  coordinates: any;
  [key: string]: any;
}

interface ImageStats {
  id: string | number;
  average: number;
  max: number;
  min: number;
  std: number;
}

interface FinalImageData {
  id: string | number;
  average: number;
  max: number;
  min: number;
  std: number;
  image: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    dataUrl: Buffer;
  };
  scale: ScaleTemplateItem[];
}

/**
 * Creates a template with color percentages based on the given image.
 *
 * @param {Buffer} image - The image data buffer.
 * @returns {Promise<ScaleTemplateItem[]>} - An array of objects representing the template with color percentages.
 */
const getTemplate = async (image: Buffer, classPercentages: number[]): Promise<ScaleTemplateItem[]> => {

  const template: ScaleItem[] = scaleTemplate.map((obj, index) => ({
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
export const getImageData = async (
  geometry: GeometryObject,
  image: Blob | Buffer | any,
  stats: ImageStats,
  classPercentages: number[]
): Promise<FinalImageData> => {
  const template = await getTemplate(image, classPercentages);
  const bbox = get_bounding_box(geometry as any);

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
