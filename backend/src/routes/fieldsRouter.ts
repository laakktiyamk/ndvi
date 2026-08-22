import { Router } from 'express';
import { getFieldInfo, getFields } from '../controllers/fieldsInfoController';
import { fieldByLocation } from "../controllers/fieldByLocationController";

const router = Router();

router.get('/', getFields);          // GET  /api/fields

router.post('/info', getFieldInfo);  // POST /api/fields/info

router.get("/by-location", fieldByLocation);


export default router;
