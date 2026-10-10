"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ndviController_1 = require("../controllers/ndviController");
const sentinelhub_token_1 = require("../sentinelhub/sentinelhub_token");
const router = (0, express_1.Router)();
// Protected routes (Require Sentinel Hub token verification)
router.post("/dates", sentinelhub_token_1.checkToken, ndviController_1.processAOI);
//router.post("/activate", checkToken, activate);
// Public routes (ei checkTokenia, koska MongoDB-luku ei tarvitse tokenia)
router.get("/image/:sentinelid", ndviController_1.image);
//router.post("/weather", weather);
//router.get("/aois", AOIs);
router.post("/images", ndviController_1.images);
exports.default = router;
