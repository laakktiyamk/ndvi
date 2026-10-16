import { Request, Response } from 'express';
import rewind from '@turf/rewind';
import { validateGeometry } from '../utils/validateGeometry';

export const validateGeoJSON = (req: Request, res: Response) => {
  const { geometry } = req.body;

  if (!geometry) {
    return res.status(400).json({ valid: false, errors: ['No geometry provided'] });
  }

  const errors = validateGeometry(geometry);
  if (errors.length > 0) {
    return res.status(200).json({ valid: false, errors });
  }

  return res.status(200).json({
    valid: true,
    errors: [],
    geometry: rewind(geometry, { mutate: false }), // korjattu geometria frontendille
  });
};