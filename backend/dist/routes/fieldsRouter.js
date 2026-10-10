"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fieldsInfoController_1 = require("../controllers/fieldsInfoController");
const fieldByLocationController_1 = require("../controllers/fieldByLocationController");
const fieldsByBboxController_1 = require("../controllers/fieldsByBboxController");
const cropParcelsByFieldController_1 = require("../controllers/cropParcelsByFieldController");
const cropTypeController_1 = require("../controllers/cropTypeController");
const cropParcelsByGeometryController_1 = require("../controllers/cropParcelsByGeometryController");
const router = (0, express_1.Router)();
router.get('/', fieldsInfoController_1.getFields);
router.post('/info', fieldsInfoController_1.getFieldInfo);
router.get("/by-location", fieldByLocationController_1.fieldByLocation);
router.get("/by-bbox", fieldsByBboxController_1.fieldsByBbox); // ← uusi
router.get("/crop-types", cropTypeController_1.getCropTypes);
router.delete('/:id', fieldsInfoController_1.deleteField);
router.get("/:peruslohkotunnus/crop-parcels", cropParcelsByFieldController_1.cropParcelsByField);
router.post("/crop-parcels", cropParcelsByGeometryController_1.cropParcelsByGeometry);
exports.default = router;
