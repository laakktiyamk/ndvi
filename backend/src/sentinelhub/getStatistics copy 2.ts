import axios, { AxiosResponse } from "axios";
import * as calculateDim from "../utils/calculateDim";

export interface Geometry {
  type: string;
  coordinates: any[];
}

export interface NdviStats {
  min: number;
  max: number;
  mean: number;
  stDev: number;
  sampleCount: number;
  noDataCount: number;
}

export interface HistogramBin {
  lowEdge: number;
  highEdge: number;
  count: number;
}

export interface DayStatistics {
  interval: {
    from: string;
    to: string;
  };
  outputs: {
    ndvi: {
      bands: {
        B0: {
          stats: NdviStats;
        };
      };
    };
    classBand: {
      bands: {
        B0: {
          histogram: {
            bins: HistogramBin[];
          };
        };
      };
    };
  };
}

export const getStatistics = async (
  geometry: Geometry,
  dateFrom: string,
  dateTo: string,
  authToken: string
): Promise<DayStatistics[]> => {

  const evalscript = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "dataMask"],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "classBand", bands: 1, sampleType: "UINT8" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  if (s.dataMask === 0) {
    return { ndvi: [0], classBand: [0], dataMask: [0] };
  }
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  let cls = 0;
  if      (ndvi < 0.30) cls = 1;
  else if (ndvi < 0.45) cls = 2;
  else if (ndvi < 0.60) cls = 3;
  else if (ndvi < 0.65) cls = 4;
  else if (ndvi < 0.70) cls = 5;
  else if (ndvi < 0.75) cls = 6;
  else if (ndvi < 0.80) cls = 7;
  else if (ndvi < 0.85) cls = 8;
  else                   cls = 9;
  return { ndvi: [ndvi], classBand: [cls], dataMask: [1] };
}
`;

  async function getWidthAndHeight(geom: Geometry): Promise<{ width: number; height: number }> {
    const res = 512;
    let width = res;
    let height = await calculateDim.calculateHeight(geom, width);
    if (width < height) {
      height = res;
      width = await calculateDim.calculateWidth(geom, height);
    }
    return { width, height };
  }

  const { width, height } = await getWidthAndHeight(geometry);

  try {
    const result: AxiosResponse<{ data: DayStatistics[] }> = await axios({
      method: "post",
      url: "https://services.sentinel-hub.com/api/v1/statistics",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        input: {
          bounds: { geometry },
          data: [
            {
              dataFilter: { maxCloudCoverage: 20 },
              type: "sentinel-2-l1c",
            },
          ],
        },
        aggregation: {
          timeRange: { from: dateFrom, to: dateTo },
          aggregationInterval: { of: "P1D" },
          RESX: "10m",
          RESY: "10m",
          width,
          height,
          evalscript,
        },
        calculations: {
          ndvi: {},
          classBand: {
            histograms: {
              default: {
                nBins: 10,
                lowEdge: 0,
                highEdge: 10,
              },
            },
          },
        },
      },
    });

    console.log("STATISTICS RESULT:", JSON.stringify(result.data.data, null, 2));
    return result.data.data;

  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error("Sentinel API error:", err.response?.data);
    } else {
      console.error("Unknown error:", err);
    }
    return [];
  }
};