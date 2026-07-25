import { Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { hint } = require('@mapbox/geojsonhint') as { hint: (data: object | string, options?: object) => { message: string; line?: number }[] };
import rewind from '@turf/rewind';

export const validateGeoJSON = (req: Request, res: Response) => {
  const { geometry } = req.body;

  if (!geometry) {
    return res.status(400).json({ valid: false, errors: ['No geometry provided'] });
  }

  try {
    const fixed = rewind(geometry, { mutate: false });
    const errors = hint(fixed);
    return res.status(200).json({
      valid: errors.length === 0,
      errors: errors.map((e: { message: string }) => e.message),
      geometry: fixed, // palautetaan korjattu geometria frontendille
    });
  } catch (err) {
    return res.status(400).json({
      valid: false,
      errors: ['Invalid input: ' + (err instanceof Error ? err.message : String(err))],
    });
  }
};