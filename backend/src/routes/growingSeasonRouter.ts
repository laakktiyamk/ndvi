import { Router } from 'express';
import { getGrowingSeason } from '../controllers/growingSeasonController';

const router = Router();
router.get('/', getGrowingSeason);

export default router;