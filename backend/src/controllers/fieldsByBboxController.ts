import { Request, Response } from "express";
import { getFieldsByBbox } from "../services/fieldParcelService";

export const fieldsByBbox = async (req: Request, res: Response): Promise<void> => {
  const { minLat, maxLat, minLon, maxLon } = req.query;

  if (!minLat || !maxLat || !minLon || !maxLon) {
    res.status(400).json({ error: "minLat, maxLat, minLon, maxLon vaaditaan" });
    return;
  }

  const minLatNum = parseFloat(minLat as string);
  const maxLatNum = parseFloat(maxLat as string);
  const minLonNum = parseFloat(minLon as string);
  const maxLonNum = parseFloat(maxLon as string);

  if ([minLatNum, maxLatNum, minLonNum, maxLonNum].some(isNaN)) {
    res.status(400).json({ error: "Parametrien pitää olla numeroita" });
    return;
  }

  const fields = await getFieldsByBbox(minLatNum, maxLatNum, minLonNum, maxLonNum);
  res.status(200).json(fields);
};