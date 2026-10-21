export interface ParsedField {
  geometry: any;
  name?: string;
}

const toGeometry = (g: any) => {
  if (typeof g !== 'string') return g;
  try { return JSON.parse(g); } catch { return null; }
};

export const parseFieldsInput = (input: any): ParsedField[] | null => {
  if (!input || typeof input !== 'object') return null;

  // { "fields": [ { "name", "geometry" }, ... ] }
  if (Array.isArray(input.fields)) {
    return input.fields.map((f: any) => ({
      geometry: toGeometry(f.geometry),
      name: f.name,
    }));
  }

  // { "name": "...", "geometry": { ... } }
  if (input.geometry && !input.type) {
    return [{ geometry: toGeometry(input.geometry), name: input.name }];
  }

  // FeatureCollection
  if (input.type === 'FeatureCollection' && Array.isArray(input.features)) {
    return input.features.map((f: any) => ({
      geometry: f.geometry,
      name: f.properties?.name,
    }));
  }

  // Feature
  if (input.type === 'Feature') {
    return [{ geometry: input.geometry, name: input.properties?.name }];
  }

  // Pelkkä geometria
  if (input.type === 'Polygon' || input.type === 'MultiPolygon') {
    return [{ geometry: input }];
  }

  return null;
};