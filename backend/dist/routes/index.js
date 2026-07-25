"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userRouter_1 = __importDefault(require("./userRouter"));
const ndviRouter_1 = __importDefault(require("./ndviRouter"));
const weatherRouter_1 = __importDefault(require("./weatherRouter"));
const chatRouter_1 = __importDefault(require("./chatRouter"));
const geocodeRouter_1 = __importDefault(require("./geocodeRouter"));
const fieldsRouter_1 = __importDefault(require("./fieldsRouter"));
const validateGeoJSONRouter_1 = __importDefault(require("./validateGeoJSONRouter"));
const router = (0, express_1.Router)();
router.use('/user', userRouter_1.default);
router.use('/ndvi', ndviRouter_1.default);
router.use('/weather', weatherRouter_1.default);
router.use('/chat', chatRouter_1.default);
router.use('/geocode', geocodeRouter_1.default);
router.use('/fields', fieldsRouter_1.default);
router.use('/validate', validateGeoJSONRouter_1.default); // lisää tämä
exports.default = router;
