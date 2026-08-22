import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { GeocodeResult, GeocodeFeature, NominatimFeature } from '../types';

const MML_BASE_URL =
  'https://avoin-paikkatieto.maanmittauslaitos.fi/geocoding/v2/pelias/search';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

const isPostalCode = (text: string): boolean => /^\d{5}$/.test(text.trim());


/**
 * GET /api/geocode?text=Pöljä
 * GET /api/geocode?text=Kuopio&bbox=true
 * Hakee paikan nimellä, kunnalla, osoitteella tai postinumerolla koordinaatit.
 *
 * Strategia:
 *  1. bbox=true → Nominatim suoraan, palauttaa center + bbox karttazoomausta varten
 *  2. Postinumero (5 numeroa) → Nominatim suoraan (MML ei tue postinumerohakua)
 *  3. Muu haku → MML geographic-names + addresses ensin
 *  4. MML palauttaa [] → fallback Nominatim
 */

export async function geocode(
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<void> {
  try {
    const { text, size, bbox } = req.query;

    if (!text || typeof text !== 'string' || text.trim().length < 2) {
      res.status(400).json({ error: 'Hakusana "text" puuttuu tai on liian lyhyt' });
      return;
    }

    const query = text.trim();

    // bbox=true → palauttaa center + bbox Nominatimista
    if (bbox === 'true') {
      const result = await searchNominatimBbox(query);
      if (!result) {
        res.status(404).json({ error: 'Paikkaa ei löydy' });
        return;
      }
      res.status(200).json({ query, source: 'nominatim', ...result });
      return;
    }

    const limit = size ? Number(size) : 5;
    let results: GeocodeResult[] = [];
    let source: string;

    if (isPostalCode(query)) {
      results = await searchNominatim(query, limit);
      source = 'nominatim';
    } else {
      results = await searchMML(query, limit);
      source = 'mml';

      if (results.length === 0) {
        results = await searchNominatim(query, limit);
        source = 'nominatim-fallback';
      }
    }

    res.status(200).json({ query, source, results });
  } catch (error) {
    if (next) {
      next(error);
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// --- MML ---

async function searchMML(text: string, size: number): Promise<GeocodeResult[]> {
  const { data } = await axios.get(MML_BASE_URL, {
    params: {
      text,
      sources: 'geographic-names,addresses',
      crs: 'EPSG:4326',
      lang: 'fi',
      size,
      'api-key': process.env.MML_API_KEY,
    },
    timeout: 5000,
  });

  return mapMMLFeatures(data.features ?? []);
}

function mapMMLFeatures(features: GeocodeFeature[]): GeocodeResult[] {
  return features.map((f) => ({
    name: f.properties.name,
    label: f.properties.label,
    municipality: f.properties.locality ?? f.properties.county ?? null,
    type: f.properties.layer,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
  }));
}

// --- Nominatim ---

async function searchNominatim(text: string, limit: number): Promise<GeocodeResult[]> {
  const { data } = await axios.get<NominatimFeature[]>(NOMINATIM_BASE_URL, {
    params: {
      format: 'json',
      q: text,
      countrycodes: 'fi',
      addressdetails: 1,
      limit,
    },
    headers: { 'User-Agent': 'NDVI-sovellus/1.0' },
    timeout: 5000,
  });

  return mapNominatimFeatures(data);
}

async function searchNominatimBbox(text: string): Promise<{
  lat: number;
  lon: number;
  bbox: [[number, number], [number, number]];
} | null> {
  const { data } = await axios.get<NominatimFeature[]>(NOMINATIM_BASE_URL, {
    params: {
      format: 'json',
      q: text,
      countrycodes: 'fi',
      addressdetails: 1,
      limit: 1,
    },
    headers: { 'User-Agent': 'NDVI-sovellus/1.0' },
    timeout: 5000,
  });

  if (!data?.length) return null;
  const f = data[0];
  const bb = f.boundingbox;

  if (!bb || bb.length < 4) return null;  // ← lisää tämä

  return {
    lat: parseFloat(f.lat),
    lon: parseFloat(f.lon),
    bbox: [
      [parseFloat(bb[0]), parseFloat(bb[2])],
      [parseFloat(bb[1]), parseFloat(bb[3])],
    ],
  };
}

function mapNominatimFeatures(features: NominatimFeature[]): GeocodeResult[] {
  return features.map((f) => ({
    name: f.display_name.split(',')[0],
    label: f.display_name,
    municipality:
      f.address?.municipality ?? f.address?.city ?? f.address?.town ?? null,
    type: f.type,
    lat: parseFloat(f.lat),
    lon: parseFloat(f.lon),
  }));
}