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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImage = void 0;
const sentinelHub = __importStar(require("@sentinel-hub/sentinelhub-js"));
const bbox_1 = require("@turf/bbox");
const calculateDim_1 = require("../utils/calculateDim");
// Apufunktio päivämäärän lisäämiseen
function addOneDay(date) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    return nextDate.toISOString();
}
// Laskee kuvan mitat suhteessa geometriaan
async function getWidthAndHeight(geometry) {
    const res = 512;
    let width = res;
    let height = await (0, calculateDim_1.calculateHeight)(geometry, width);
    if (width < height) {
        height = res;
        width = await (0, calculateDim_1.calculateWidth)(geometry, height);
    }
    return { width, height };
}
// Hakee NDVI-kuvan Sentinel Hubista
const getImage = async (date, geometry) => {
    const evalscript = `
    //VERSION=3
    function setup() {
        return { input: ["B04", "B08", "dataMask"], output: [{ id: "default", bands: 4 }, { id: "index", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1 }] };
    }
    function evaluatePixel(samples) {
        let val = index(samples.B08, samples.B04);
        let imgVals = null;
        
        // The library for tiffs works well only if there is only one channel returned.
        // So we encode the "no data" as NaN here and ignore NaNs on frontend.
        const indexVal = samples.dataMask === 1 ? val : NaN;
        
        if (val<0.30) imgVals = [0.9568627450980393, 0.2627450980392157, 0.21176470588235294,samples.dataMask];
        else if (val<0.45) imgVals = [1.0, 0.596078431372549, 0.0,samples.dataMask];                        
        else if (val<0.60) imgVals = [1.0, 0.9215686274509803, 0.23137254901960785,samples.dataMask];
        else if (val<0.65) imgVals = [0.31,0.54,0.18,samples.dataMask];
        else if (val<0.70) imgVals = [0.25,0.49,0.14,samples.dataMask];
        else if (val<0.75) imgVals = [0.19,0.43,0.11,samples.dataMask];
        else if (val<0.80) imgVals = [0.13,0.38,0.07,samples.dataMask];
        else if (val<0.85) imgVals = [0.06,0.33,0.04,samples.dataMask];
        else imgVals = [0,0.27,0,samples.dataMask];  
        return {
          default: imgVals,
          index: [indexVal],              
          dataMask: [samples.dataMask]
        };
        
    }
    `;
    const layer = new sentinelHub.S2L1CLayer({ evalscript, maxCloudCoverPercent: 20 });
    const { width, height } = await getWidthAndHeight(geometry);
    const bbox = (0, bbox_1.bbox)(geometry);
    const getMapParams = {
        bbox: new sentinelHub.BBox(sentinelHub.CRS_EPSG4326, bbox[0], bbox[1], bbox[2], bbox[3]),
        fromTime: new Date(date),
        toTime: new Date(addOneDay(date)),
        width: width,
        height: height,
        format: sentinelHub.MimeTypes.PNG,
        geometry: geometry
    };
    try {
        return await layer.getMap(getMapParams, sentinelHub.ApiType.PROCESSING);
    }
    catch (e) {
        console.error("IMAGE ERROR: ", e);
        return null;
    }
};
exports.getImage = getImage;
