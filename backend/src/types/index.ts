/*
export interface IImage {
  id: string;
  image: {
    dataUrl: Buffer;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
*/

export interface IWeather {
  sentinelid: string;
  date: string;
  geometryHash: string;
  temperature_2m_mean: number | null;
  precipitation_sum: number | null;
  shortwave_radiation_sum: number | null;
  et0_fao_evapotranspiration: number | null;
}

interface IScaleItem {
    color: string;
    amount: number;
    from?: number;
}


export interface IImage extends Document {
    /** Unique identifier for the Sentinel generation time combined with geometry hash. */
    id: string;

    /** Mean/average NDVI value of the image. */
    average: number;

    /** Maximum NDVI value found in the image. */
    max: number;

    /** Minimum NDVI value found in the image. */
    min: number;

    /** Standard deviation of the NDVI data. */
    std: number;

    /** Spatial bounds and the binary data of the image. */
    image: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
        dataUrl: Buffer;
    };

    /** Array representing the color scale analysis breakdown. */
    scale: IScaleItem[];
}

// --- Geocode ---
// --- Geocode ---

export interface NominatimFeature {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    municipality?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
  };
}

export interface GeocodeFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    name: string;
    label: string;
    layer: string; // esim. 'geographic-names', 'address'
    locality?: string;
    county?: string;
    [key: string]: unknown;
  };
}

export interface GeocodeResult {
  name: string;
  label: string;
  municipality: string | null;
  type: string;
  lat: number;
  lon: number;
}

export interface GeocodeResponse {
  query: string;
  results: GeocodeResult[];
}


