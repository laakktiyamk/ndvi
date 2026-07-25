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
const express_1 = require("express");
const ndviControllers = __importStar(require("../controllers/ndviController")); // voitais ottaa erikseen controllerit {list, activate, image, weather, AOIs} jos halutaan
const sentinelhub_token_1 = require("../sentinelhub/sentinelhub_token");
const router = (0, express_1.Router)();
// Routes
// Protected routes (Require Sentinel Hub token verification)
router.post("/dates", sentinelhub_token_1.checkToken, ndviControllers.dates);
//router.post("/activate", checkToken, ndviControllers.activate);
// Public or alternative routes (Do not require the checkToken middleware) because reading from MongoDB does not require a valid Sentinel Hub token
router.get("/image/:sentinelid", ndviControllers.image);
//router.post("/weather", ndviControllers.weather);
router.get("/aois", ndviControllers.AOIs);
router.post("/images", ndviControllers.images);
exports.default = router;
