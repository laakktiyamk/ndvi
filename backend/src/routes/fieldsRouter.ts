import { Router } from 'express';
import { getFieldInfo, getFields } from '../controllers/fieldsInfoController';
import { fieldByLocation } from "../controllers/fieldByLocationController";
import { cropParcelsByField } from "../controllers/cropParcelsByFieldController";
import { getCropTypes } from "../controllers/cropTypeController";

const router = Router();

router.get('/', getFields);          // GET  /api/fields

router.post('/info', getFieldInfo);  // POST /api/fields/info

router.get("/by-location", fieldByLocation);
router.get("/:peruslohkotunnus/crop-parcels", cropParcelsByField); // GET /api/fields/0040006537/crop-parcels

router.get("/crop-types", getCropTypes);

export default router;
