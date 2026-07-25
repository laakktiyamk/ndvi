import { Router } from 'express';
import { validateGeoJSON } from '../controllers/validateGeoJSONController';

const router = Router();

router.post('/geojson', validateGeoJSON);

export default router;