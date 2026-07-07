import { Request, Response, NextFunction } from 'express';
import axios from "axios";
import pLimit from 'p-limit';
import * as hash from "../utils/hash";
import jwt from 'jsonwebtoken';
const geoUtils = require("../utils/geoUtils");
import { getStatistics } from "../sentinelhub/getStatistics";
import * as imageRef from "../sentinelhub/getImage";
import * as imageDataRef from "../utils/image/getImageData";
import * as dateTime from "../utils/dateTime";
import * as mongodb from "../mongo/mongodb";
import growingSeason from "../settings/growingSeason.json";
import isDateInGrowingSeason from "../utils/isdateingrowingseason";
import { SentinelRequest } from "../sentinelhub/sentinelhub_token";
import { IImage } from '../types';
import { getWeatherFromDbOrFetch } from '../services/weatherService';
import rewind from '@turf/rewind';

interface JwtPayload {
  _id: string;
  username: string;
}

const getUserId = (req: Request): string => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return '';
    const decoded = jwt.verify(token, process.env.SECRET as string) as JwtPayload;
    return decoded._id;
  } catch {
    return '';
  }
};

// ============================================================
// Interfaces
// ============================================================

interface SentinelStat {
  interval: { from: string; to: string; };
  outputs: {
    ndvi: {
      bands: {
        B0: {
          stats: {
            mean: number;
            max: number;
            min: number;
            stDev: number;
          };
        };
      };
    };
  };
  ndviClassPercentages: number[];
}

interface SentinelDate {
  generationtime: string;
  stats: {
    average: number;
    max: number;
    min: number;
    std: number;
  };
  sentinelid: string;
  ndviClassPercentages: number[];
}

let globalAuthToken: string | null | undefined = null;

// ============================================================
// Helpers
// ============================================================

const getSentinelDates = async (
  geometry: any,
  fromTime: Date | null,
  toTime: Date
): Promise<SentinelDate[]> => {
  let data: SentinelDate[] = [];
  let stats: SentinelStat[] = [];

  try {
    stats = await getStatistics(
      geometry,
      fromTime?.toISOString() ?? "",
      toTime.toISOString(),
      globalAuthToken ?? ""
    ) as unknown as SentinelStat[];
  } catch (e: any) {
    console.error("#### Error fetching statistics: ", e.error ? e.error.message : e.message);
    return data;
  }

  if (stats && stats.length > 0) {
    const reversedStats = [...stats].reverse();
    for (const stat of reversedStats) {
      const statRef = stat.outputs.ndvi.bands.B0.stats;
      if (statRef.mean >= 0.1) {
        data = [
          ...data,
          {
            generationtime: stat.interval.from,
            stats: {
              average: statRef.mean,
              max: statRef.max,
              min: statRef.min,
              std: statRef.stDev,
            },
            sentinelid: stat.interval.from + "_" + hash.sha256(geometry),
            ndviClassPercentages: stat.ndviClassPercentages,
          },
        ];
      }
    }
  } else {
    console.log("No data for the geometry", fromTime, " - ", toTime);
  }

  return data;
};

const getImageWithData = async (item: SentinelDate, geometry: any): Promise<any> => {
  const image = await imageRef.getImage(item.generationtime, geometry);
  if (image) {
    const data = await imageDataRef.getImageData(
      geometry, image,
      { id: item.sentinelid, average: item.stats.average, max: item.stats.max, min: item.stats.min, std: item.stats.std },
      item.ndviClassPercentages
    );
    return data;
  }
  return null;
};

const saveSentinelDataToMongo = async (
  save: boolean,
  geometry: any,
  fromTime: Date | null,
  toTime: Date,
  name: string = '',
  userId: string = ''
): Promise<boolean> => {
  const id   = hash.sha256(geometry);
  const area = geoUtils.getAreaFromGeometry(geometry);
  type SentinelDatesWithoutPercentages = Omit<SentinelDate, "ndviClassPercentages">;
  let savedDates: SentinelDatesWithoutPercentages[] = [];
  let res: any = null;

  try {
    if (save) {
      res = await mongodb.saveDates(id, savedDates, geometry, area ?? 0, name, userId);
    }

    const startTime = performance.now();
    const dates = await getSentinelDates(geometry, fromTime, toTime);
    console.log(dates.length, " STATISTICS ElapsedTime (sec): ", (performance.now() - startTime) / 1000);

    if (dates.length > 0) {
      const limit = pLimit(5);
      await axios.all(
        dates.map(item => limit(async () => {
          const _data = await getImageWithData(item, geometry);
          if (_data) await mongodb.saveImage(_data);
        }))
      );

      savedDates = dates.map(({ ndviClassPercentages, ...rest }) => rest);
      savedDates = dateTime.sortByDateTime(savedDates, "generationtime", "desc");
      res = await mongodb.updateDates(id, savedDates, userId);
      return res;
    }

    return false;
  } catch (e: any) {
    console.log("XXerror: ", e.message);
    return false;
  }
};

async function getDates(
  returnData: boolean,
  geometry: any,
  fromTime: Date | null,
  toTime: Date,
  name: string = '',
  userId: string = ''
): Promise<any> {
  const id = hash.sha256(geometry);
  let data = await mongodb.getDates(id);

  if (!data || !data.dates || data.dates.length === 0) {
    await saveSentinelDataToMongo(true, geometry, fromTime, toTime, name, userId);
  } else {
    if (isDateInGrowingSeason(toTime, growingSeason)) {
      if (data.dates[0].generationtime < dateTime.zeroDateTime(toTime)) {
        const newFromTime = new Date(dateTime.addOneDay(data.dates[0].generationtime));
        await saveSentinelDataToMongo(false, geometry, newFromTime, toTime, name, userId);
      }
    }
    // Päivitä nimi ja userId jos puuttuu
    if ((name && !data.name) || (userId && !data.userIds?.includes(userId))) {
      await mongodb.saveDates(id, data.dates, geometry, data.area ?? 0, name || data.name, userId);
    }
  }

  if (returnData) {
    return await mongodb.getDates(id);
  }
  return null;
}

// ============================================================
// Route handlers
// ============================================================

export const AOIs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const data: any = await mongodb.getBlocks();
  res.status(200).send(data);
};

export const dates = async (req: SentinelRequest, res: Response, next: NextFunction): Promise<void> => {
  globalAuthToken = req.authToken;
  const startTime = performance.now();
  //let updateDbFlag = false;

  //try { updateDbFlag = req.body.updateDb; } catch (e) { updateDbFlag = false; }

  let geometry: any = null;
  try {
    const raw = typeof req.body.geometry !== "object"
      ? JSON.parse(req.body.geometry)
      : req.body.geometry;
    geometry = rewind(raw, { mutate: false });
  } catch (e) { }

  const fromTime = new Date(req.body.start_date);
  const toTime   = new Date();
  const name     = req.body.name ?? '';
  const userId   = getUserId(req);     // ← puretaan JWT:stä

  const data = await getDates(true, geometry, fromTime, toTime, name, userId);
  console.log("Request handled in (sec): ", (performance.now() - startTime) / 1000);

  const wStart = performance.now();
  await getWeatherFromDbOrFetch(geometry, fromTime, toTime);
  console.log("Weather saved in (sec): ", (performance.now() - wStart) / 1000);

  //if (updateDbFlag) {
    //res.status(222).send("done");
  //} else {
    if (data) {
      res.status(200).send(data);
    } else {
      res.status(404).send("no data available");
    }
  //}
};

// ============================================================
// Image handler
// ============================================================

interface RawImageData {
  dataUrl: { buffer: Buffer };
  minX: number; minY: number; maxX: number; maxY: number;
}

interface ProcessedImageData extends Omit<RawImageData, 'dataUrl'> {
  dataUrl: string;
}

export const image = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id  = req.params.sentinelid;
  const all = req.query.all as string | undefined;

  if (all) {
    const rawData: IImage[] = await mongodb.getAllImages(id as string);
    try {
      const data = rawData.map((item) => {
        const updatedImage: ProcessedImageData = {
          ...item.image,
          dataUrl: `data:image/png;base64,${Buffer.from(item.image.dataUrl.buffer).toString('base64')}`,
        };
        return { ...item, image: updatedImage };
      });
      res.status(200).send(data);
      return;
    } catch (e: unknown) {
      if (e instanceof Error) console.log(e.message);
    }
  }

  const _data = await mongodb.getImage(id as string);
  if (_data) {
    const dataUrl = `data:image/png;base64,${Buffer.from(_data.image.dataUrl.buffer).toString('base64')}`;
    res.status(200).send({ ..._data, image: { ..._data.image, dataUrl } });
  }
};

export const images = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids array required' });
    return;
  }

  try {
    const rawData: IImage[] = await mongodb.getImagesByIds(ids);
    
    // Muodostetaan Record<sentinelid, image>
    const imageMap = rawData.reduce((acc, item) => {
      acc[item.id] = {
        ...item,
        image: {
          ...item.image,
          dataUrl: `data:image/png;base64,${Buffer.from(item.image.dataUrl.buffer).toString('base64')}`,
        },
      };
      return acc;
    }, {} as Record<string, any>);

    res.status(200).json(imageMap);
  } catch (e: unknown) {
    if (e instanceof Error) console.error(e.message);
    res.status(500).json({ error: 'Server error' });
  }
};