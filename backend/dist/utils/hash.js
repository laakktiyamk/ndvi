"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Calculates the SHA-256 hash of a given geometry object or string.
 * @param {unknown | string} geometry - The geometry object or string.
 * @returns {string} The SHA-256 hash.
 */
const sha256 = (geometry) => {
    let jsonString;
    if (typeof geometry !== "string") {
        jsonString = JSON.stringify(geometry);
    }
    else {
        jsonString = geometry;
    }
    const hash = crypto_1.default.createHash("sha256").update(jsonString).digest("hex");
    return hash;
};
exports.sha256 = sha256;
