import { Router } from 'express';
import { geocode } from '../controllers/geocodeController';

const router = Router();

router.get('/', geocode);

export default router;
