"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGeoJSON = void 0;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { hint } = require('@mapbox/geojsonhint');
const rewind_1 = __importDefault(require("@turf/rewind"));
const validateGeoJSON = (req, res) => {
    const { geometry } = req.body;
    if (!geometry) {
        return res.status(400).json({ valid: false, errors: ['No geometry provided'] });
    }
    try {
        const fixed = (0, rewind_1.default)(geometry, { mutate: false });
        const errors = hint(fixed);
        return res.status(200).json({
            valid: errors.length === 0,
            errors: errors.map((e) => e.message),
            geometry: fixed, // palautetaan korjattu geometria frontendille
        });
    }
    catch (err) {
        return res.status(400).json({
            valid: false,
            errors: ['Invalid input: ' + (err instanceof Error ? err.message : String(err))],
        });
    }
};
exports.validateGeoJSON = validateGeoJSON;
