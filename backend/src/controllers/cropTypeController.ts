import { Request, Response } from "express";
import { getAllCropTypes } from "../services/cropTypeService";

export const getCropTypes = async (req: Request, res: Response): Promise<void> => {
  const cropTypes = await getAllCropTypes();
  res.json(cropTypes);
};