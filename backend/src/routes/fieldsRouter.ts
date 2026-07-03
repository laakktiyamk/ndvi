import { Router } from 'express';
import { getFieldInfo, getFields } from '../controllers/fieldsInfoController';

const router = Router();

router.get('/', getFields);          // GET  /api/fields
router.post('/info', getFieldInfo);  // POST /api/fields/info

export default router;
