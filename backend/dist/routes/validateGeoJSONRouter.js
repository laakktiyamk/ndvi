"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validateGeoJSONController_1 = require("../controllers/validateGeoJSONController");
const router = (0, express_1.Router)();
router.post('/geojson', validateGeoJSONController_1.validateGeoJSON);
exports.default = router;
