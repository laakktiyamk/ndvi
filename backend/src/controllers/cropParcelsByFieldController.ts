import { Request, Response } from "express";
import { CropParcel } from "../mongo/models/CropParcel";


export const cropParcelsByField = async (req: Request, res: Response): Promise<void> => {
  const { peruslohkotunnus } = req.params;

  if (!peruslohkotunnus) {
    res.status(400).json({ error: "peruslohkotunnus vaaditaan" });
    return;
  }

  const cropParcels = await CropParcel.find(
    { peruslohkotunnus },
    {
      tunnus: 1,
      lohkonumero: 1,
      kasvikoodi: 1,      
      pinta_ala: 1,
      luomuviljely: 1,
      geometry: 1,
      _id: 0,
    }
  ).lean();

  if (!cropParcels.length) {
    res.status(404).json({ error: "Ei kasvulohkoja peruslohkotunnuksella: " + peruslohkotunnus });
    return;
  }

  res.status(200).json(cropParcels);
};