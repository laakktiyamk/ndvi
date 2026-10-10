import { Request, Response } from "express";
import { getByGeometry } from "../services/cropParcelService" ; // sovita polku ja tiedostonimi omaan service-tiedostoosi

export const cropParcelsByGeometry = async (req: Request, res: Response) => {
  const geometry = req.body?.geometry;
  if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) {
    return res.status(400).json({ error: "Polygon or MultiPolygon geometry required" });
  }
  try {
    const parcels = await getByGeometry(geometry);
    return res.json(parcels);
  } catch (err) {
    console.error("cropParcelsByGeometry failed:", err);
    return res.status(500).json({ error: "crop parcel lookup failed" });
  }
};