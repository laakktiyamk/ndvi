import { Request, Response } from "express";
import * as mongodb from "../mongo/mongodb";
import { askNdviQuestion } from "../services/chatService";

export const chat = async (req: Request, res: Response): Promise<void> => {
const { question, geometryHash, geometry } = req.body;


  if (!question) {
    res.status(400).json({ error: "question and geometryHash required" });
    return;
  }

  const ndviData = await mongodb.getDates(geometryHash);
  const weatherData = await mongodb.getAllWeather(geometryHash);

  //console.log("geometryHash:", geometryHash);
  //console.log("ndviData:", ndviData);
  //console.log("weatherData:", weatherData);
  console.log("ndviData:", JSON.stringify(ndviData, null, 2));

  if (!ndviData && !weatherData.length) {
    res.status(404).json({ error: "no data found" });
    return;
  }

  //const answer = await askNdviQuestion(question, ndviData, weatherData);
  const answer = await askNdviQuestion(question, ndviData, weatherData, geometry);
  res.status(200).json({ answer });
};