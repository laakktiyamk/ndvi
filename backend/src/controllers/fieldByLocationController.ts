import { Request, Response } from "express";
import { FieldParcel } from "../mongo/models/FieldParcel";

export const fieldByLocation = async (req: Request, res: Response): Promise<void> => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    res.status(400).json({ error: "lat ja lon vaaditaan query-parametreina" });
    return;
  }

  const latNum = parseFloat(lat as string);
  const lonNum = parseFloat(lon as string);

  if (isNaN(latNum) || isNaN(lonNum)) {
    res.status(400).json({ error: "lat ja lon pitää olla numeroita" });
    return;
  }

  // GeoJSON järjestys: [longitude, latitude]
  const point = {
    type: "Point",
    coordinates: [lonNum, latNum],
  };

  const field = await FieldParcel.findOne({
    geometry: { $geoIntersects: { $geometry: point } },
  }).lean();

  if (!field) {
    res.status(404).json({ error: "Ei peltolohkoa annetuissa koordinaateissa" });
    return;
  }

  res.status(200).json(field);
};