"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const growingSeasonController_1 = require("../controllers/growingSeasonController");
const router = (0, express_1.Router)();
router.get('/', growingSeasonController_1.getGrowingSeason);
exports.default = router;
