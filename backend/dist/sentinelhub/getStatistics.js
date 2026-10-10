"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatistics = void 0;
const axios_1 = __importDefault(require("axios"));
const calculateDim = __importStar(require("../utils/calculateDim"));
const getStatistics = async (geometry, dateFrom, dateTo, authToken) => {
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
    async function getWidthAndHeight(geom) {
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
        const result = await (0, axios_1.default)({
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
        return result.data.data.map((dayData) => {
            const bins = dayData.outputs?.classBand?.bands?.B0?.histogram?.bins ?? [];
            const total = bins.reduce((sum, b) => sum + b.count, 0);
            /*const ndviClassPercentages: NdviClassPercentage[] = bins
              .filter((b) => b.count > 0)
              .map((b) => ({
                class: b.lowEdge,
                percentage: total > 0 ? +((b.count / total) * 100).toFixed(2) : 0,
              }));*/
            /*const ndviClassPercentages: number[] = bins.map((b) =>
              total > 0 ? +((b.count / total) * 100).toFixed(2) : 0
            );*/
            /*
                  const ndviClassPercentages: number[] = [
                    bins.filter(b => b.lowEdge === 1).reduce((sum, b) => sum + b.count, 0),  // cls 1
                    bins.filter(b => b.lowEdge === 2).reduce((sum, b) => sum + b.count, 0),  // cls 2
                    bins.filter(b => b.lowEdge === 3).reduce((sum, b) => sum + b.count, 0),  // cls 3
                    bins.filter(b => b.lowEdge >= 4).reduce((sum, b) => sum + b.count, 0),   // cls 4-9
                  ].map(count => total > 0 ? +((count / total) * 100).toFixed(2) : 0);
            */
            const raw = [
                bins.filter(b => b.lowEdge === 1).reduce((sum, b) => sum + b.count, 0),
                bins.filter(b => b.lowEdge === 2).reduce((sum, b) => sum + b.count, 0),
                bins.filter(b => b.lowEdge === 3).reduce((sum, b) => sum + b.count, 0),
                bins.filter(b => b.lowEdge >= 4).reduce((sum, b) => sum + b.count, 0),
            ].map(count => total > 0 ? (count / total) * 100 : 0);
            // Pyöristetään ja korjataan erotus
            const floored = raw.map(v => Math.floor(v));
            const remainders = raw.map((v, i) => ({ index: i, remainder: v - floored[i] }));
            const diff = 100 - floored.reduce((sum, v) => sum + v, 0);
            remainders
                .sort((a, b) => b.remainder - a.remainder)
                .slice(0, diff)
                .forEach(r => floored[r.index]++);
            const ndviClassPercentages = floored;
            return {
                interval: dayData.interval,
                outputs: {
                    ndvi: dayData.outputs.ndvi,
                },
                ndviClassPercentages,
            };
        });
    }
    catch (err) {
        if (axios_1.default.isAxiosError(err)) {
            console.error("Sentinel API error:", err.response?.data);
        }
        else {
            console.error("Unknown error:", err);
        }
        return [];
    }
};
exports.getStatistics = getStatistics;
