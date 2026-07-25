"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fieldsInfoController_1 = require("../controllers/fieldsInfoController");
const router = (0, express_1.Router)();
router.get('/', fieldsInfoController_1.getFields); // GET  /api/fields
router.post('/info', fieldsInfoController_1.getFieldInfo); // POST /api/fields/info
exports.default = router;
