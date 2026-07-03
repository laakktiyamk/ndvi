import { Request, Response} from 'express';
import * as mongodb from "../mongo/mongodb";

export const weatherAll = async (req: Request, res: Response): Promise<void> => {
  
  const geometryHash = req.body.geometryHash as string;
  
  const data = await mongodb.getAllWeather(geometryHash);
    
  if (data.length > 0) {

    //
    //const forDate = data.find(w => w.date === "2026-04-24T00:00:00Z_f18e29d28a39d54329d9d9cfe203d70f92e4562dec61edf11d542d8ac840f115");
    //console.log("forDate: ", forDate);

    res.status(200).json(data);
  } else {
    res.status(404).json({ error: "no weather data found" });
  }
};


export const weather = async (req: Request, res: Response): Promise<void> => {
  const { sentinelid } = req.body;
  const data = await mongodb.getWeather(sentinelid);
  
  if (data) {
    res.status(200).json(data);
  } else {
    res.status(404).json({ error: "no weather data found" });
  }
};