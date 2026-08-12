import axios from "axios";
import { bbox as get_bounding_box } from "@turf/bbox";
import { calculateHeight, calculateWidth } from "../utils/calculateDim";

const CDSE_PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process";

interface GeoJSONPolygon {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}
interface WidthHeight { width: number; height: number; }

function addOneDay(date: Date | string): string {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate.toISOString();
}

async function getWidthAndHeight(geometry: GeoJSONPolygon): Promise<WidthHeight> {
  const res = 512; //1024;
  let width = res;
  let height = await calculateHeight(geometry, width);
  if (width < height) {
    height = res;
    width = await calculateWidth(geometry, height);
  }
  return { width, height };
}

const evalscript = `
//VERSION=3
function setup() {
    return { input: ["B04", "B08", "dataMask"], output: [{ id: "default", bands: 4 }, { id: "index", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1 }] };
}
function evaluatePixel(samples) {
    let val = index(samples.B08, samples.B04);
    const indexVal = samples.dataMask === 1 ? val : NaN;
    let imgVals;
    if (val<0.30) imgVals = [0.957,0.263,0.212,samples.dataMask];
    else if (val<0.45) imgVals = [1.0,0.596,0.0,samples.dataMask];
    else if (val<0.60) imgVals = [1.0,0.922,0.231,samples.dataMask];
    else if (val<0.65) imgVals = [0.31,0.54,0.18,samples.dataMask];
    else if (val<0.70) imgVals = [0.25,0.49,0.14,samples.dataMask];
    else if (val<0.75) imgVals = [0.19,0.43,0.11,samples.dataMask];
    else if (val<0.80) imgVals = [0.13,0.38,0.07,samples.dataMask];
    else if (val<0.85) imgVals = [0.06,0.33,0.04,samples.dataMask];
    else imgVals = [0,0.27,0,samples.dataMask];
    return { default: imgVals, index: [indexVal], dataMask: [samples.dataMask] };
}
`;

export const getImage = async (
  date: Date | string,
  geometry: GeoJSONPolygon,
  authToken: string
): Promise<Buffer | null> => {
  const { width, height } = await getWidthAndHeight(geometry);
  const bbox = get_bounding_box(geometry as any);

  const requestBody = {
    input: {
      bounds: {
        bbox: [bbox[0], bbox[1], bbox[2], bbox[3]],
        geometry,
        properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" },
      },
      data: [{
        type: "sentinel-2-l1c",
        dataFilter: {
          timeRange: {
            from: new Date(date).toISOString(),
            to: new Date(addOneDay(date)).toISOString(),
          },
          maxCloudCoverage: 20,
        },
      }],
    },
    output: {
    width,
    height,    
      responses: [{ identifier: "default", format: { type: "image/png" } }],
    },
    evalscript,
  };

  try {
    const response = await axios.post(CDSE_PROCESS_URL, requestBody, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data);
  } catch (e) {
    console.error("IMAGE ERROR: ", e);
    return null;
  }
};