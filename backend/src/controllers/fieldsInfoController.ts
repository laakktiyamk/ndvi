import { Request, Response, NextFunction } from 'express';
import centroid from '@turf/centroid';
import rewind from '@turf/rewind';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { Geometry } from 'geojson';
import * as mongodb from '../mongo/mongodb';
import { getUserId } from '../utils/getTokenUserId'

interface JwtPayload {
  _id: string;
  username: string;
}

// ── Reverse geocoding Nominatimilla ──────────────────────────
const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon, format: 'json', 'accept-language': 'fi' },
      headers: { 'User-Agent': 'NDVI-Monitor/1.0' },
      timeout: 5000,
    });
    const addr = res.data.address;
    const parts = [
      addr.village || addr.town || addr.city || addr.municipality,
      addr.county || addr.state,
    ].filter(Boolean);
    return parts.join(', ') || res.data.display_name;
  } catch {
    return '';
  }
};

// ── Ruokavirasto WFS ─────────────────────────────────────────
const fetchRuokavirastoInfo = async (lat: number, lon: number): Promise<{
  fieldName: string | null;
  cropType: string | null;
}> => {
  try {
    const url = 'https://inspire.ruokavirasto.fi/geoserver/wfs';
    const res = await axios.get(url, {
      params: {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: 'inspire:PeltolohkoRekisteri',
        outputFormat: 'application/json',
        CQL_FILTER: `INTERSECTS(geometry,POINT(${lon} ${lat}))`,
        maxFeatures: 1,
      },
      timeout: 8000,
    });
    const features = res.data?.features;
    if (features?.length > 0) {
      const props = features[0].properties;
      return {
        fieldName: props?.lohkon_nimi || props?.LOHKON_NIMI || null,
        cropType:  props?.kasvilaji   || props?.KASVILAJI   || null,
      };
    }
    return { fieldName: null, cropType: null };
  } catch (err: unknown) {
    console.warn('Ruokavirasto fetch failed:', err instanceof Error ? err.message : err);
    return { fieldName: null, cropType: null };
  }
};

// ── POST /api/fields/info ─────────────────────────────────────
export const getFieldInfo = async (
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<void> => {
  console.log('req.body:', JSON.stringify(req.body).slice(0, 300));
  
  let geometry: Geometry | null = null;
  try {
    const raw = typeof req.body.geometry === 'object'
      ? req.body.geometry
      : JSON.parse(req.body.geometry);
    
    console.log('raw.type:', raw?.type);
    console.log('raw keys:', Object.keys(raw || {}));
    
    geometry = rewind(raw, { mutate: false }) as unknown as Geometry;
  } catch (err) {
    console.error('parse/rewind error:', err);
    res.status(400).json({ error: 'Invalid geometry' });
    return;
  }

  if (!geometry) {
    res.status(400).json({ error: 'Geometry required' });
    return;
  }

  try {
    const c = centroid({ type: 'Feature', geometry, properties: {} });
    const [lon, lat] = c.geometry.coordinates;

    const [address, ruokavirasto] = await Promise.all([
      reverseGeocode(lat, lon),
      fetchRuokavirastoInfo(lat, lon),
    ]);

    const name = ruokavirasto.fieldName || address || '';

    res.status(200).json({
      centroid: { lat, lon },
      address,
      fieldName: ruokavirasto.fieldName,
      cropType:  ruokavirasto.cropType,
      name,
      geometry,
    });
  } catch (err: unknown) {
    console.error('getFieldInfo error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// ── GET /api/fields ───────────────────────────────────────────
export const getFields = async (
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    console.log('####### userId tokenista:', userId);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    console.log('Fetching fields for userId:', userId);
    const data = await mongodb.getAllDateSets(userId);
    res.status(200).json(data);
  } catch (err: unknown) {
    console.error('getFields error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/fields/:id
export const deleteField = async (
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<void> => {

  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;

    // Tarkistetaan että pelto kuuluu käyttäjälle
    const data = await mongodb.getDates(id);
    if (!data) {
      res.status(404).json({ error: 'Field not found' });
      return;
    }
    if (!data.userIds?.includes(userId)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Poistetaan Dates-dokumentti, Images ja Weather
    await Promise.all([
      mongodb.deleteDates(id),
      mongodb.deleteImagesByHash(id),
      mongodb.deleteWeatherByHash(id),
    ]);

    res.status(200).json({ ok: true });
  } catch (err: unknown) {
    console.error('deleteField error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};