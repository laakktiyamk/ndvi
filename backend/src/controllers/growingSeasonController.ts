import { Request, Response } from 'express';
import growingSeason from '../settings/growingSeason.json';

export const getGrowingSeason = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json(growingSeason);
};