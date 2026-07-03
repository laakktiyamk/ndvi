import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { GeocodeResult, GeocodeFeature, NominatimFeature } from '../types';

const MML_BASE_URL =
  'https://avoin-paikkatieto.maanmittauslaitos.fi/geocoding/v2/pelias/search';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

const isPostalCode = (text: string): boolean => /^\d{5}$/.test(text.trim());

/**
 * GET /api/geocode?text=Pöljä
 * Hakee paikan nimellä, kunnalla tai postinumerolla koordinaatit.
 *
 * Strategia:
 *  1. Postinumero (5 numeroa) → Nominatim suoraan (MML ei tue postinumerohakua)
 *  2. Muu haku → MML geographic-names + addresses ensin
 *  3. MML palauttaa [] → fallback Nominatim
 */
export async function geocode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { text, size } = req.query;

    if (!text || typeof text !== 'string' || text.trim().length < 2) {
      res.status(400).json({ error: 'Hakusana "text" puuttuu tai on liian lyhyt' });
      return;
    }

    const query = text.trim();
    const limit = size ? Number(size) : 5;
    let results: GeocodeResult[] = [];
    let source: string;

    if (isPostalCode(query)) {
      // Postinumero → Nominatim suoraan
      results = await searchNominatim(query, limit);
      source = 'nominatim';
    } else {
      // Paikannimi tai osoite → MML ensin
      results = await searchMML(query, limit);
      source = 'mml';

      // MML ei löytänyt mitään → fallback Nominatim
      if (results.length === 0) {
        results = await searchNominatim(query, limit);
        source = 'nominatim-fallback';
      }
    }

    res.status(200).json({ query, source, results });
  } catch (error) {
    next(error);
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
    // GeoJSON-järjestys [lon, lat] -> käännetään Leafletille [lat, lon]
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
    headers: {
      'User-Agent': 'NDVI-sovellus/1.0',
    },
    timeout: 5000,
  });

  return mapNominatimFeatures(data);
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
