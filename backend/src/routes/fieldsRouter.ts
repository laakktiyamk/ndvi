import { Router } from 'express';
import { getFieldInfo, getFields, deleteField } from '../controllers/fieldsInfoController';
import { fieldByLocation } from "../controllers/fieldByLocationController";
import { fieldsByBbox } from "../controllers/fieldsByBboxController";
import { cropParcelsByField } from "../controllers/cropParcelsByFieldController";
import { getCropTypes } from "../controllers/cropTypeController";

const router = Router();

router.get('/', getFields);
router.post('/info', getFieldInfo);
router.get("/by-location", fieldByLocation);
router.get("/by-bbox", fieldsByBbox);        // ← uusi
router.get("/crop-types", getCropTypes);
router.delete('/:id', deleteField);
router.get("/:peruslohkotunnus/crop-parcels", cropParcelsByField);

export default router;