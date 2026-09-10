import { FieldParcel } from "../mongo/models/FieldParcel";

export const getFieldByLocation = async (lat: number, lon: number) => {
  const point = {
    type: "Point",
    coordinates: [lon, lat],
  };

  return FieldParcel.findOne({
    geometry: { $geoIntersects: { $geometry: point } },
  }).lean();
};

export const getFieldsByBbox = async (
  minLat: number, maxLat: number,
  minLon: number, maxLon: number
) => {
  const bbox = {
    type: "Polygon",
    coordinates: [[
      [minLon, minLat],
      [maxLon, minLat],
      [maxLon, maxLat],
      [minLon, maxLat],
      [minLon, minLat],
    ]],
  };

  return FieldParcel.find({
    geometry: { $geoIntersects: { $geometry: bbox } },
  }).lean();
};