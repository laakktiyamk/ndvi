import { FieldParcel } from "../mongo/models/FieldParcel";

export const getFieldByLocation = async (lat: number, lon: number) => {
  const point = {
    type: "Point",
    coordinates: [lon, lat], // GeoJSON järjestys: [longitude, latitude]
  };

  return FieldParcel.findOne({
    geometry: { $geoIntersects: { $geometry: point } },
  }).lean();
};