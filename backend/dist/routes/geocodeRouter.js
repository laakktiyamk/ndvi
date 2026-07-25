"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const geocodeController_1 = require("../controllers/geocodeController");
const router = (0, express_1.Router)();
router.get('/', geocodeController_1.geocode);
exports.default = router;
