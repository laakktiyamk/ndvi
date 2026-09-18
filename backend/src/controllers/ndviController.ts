import { Request, Response, NextFunction } from 'express';
import rewind from '@turf/rewind';
import * as hash from "../utils/hash";
const geoUtils = require("../utils/geoUtils");
import { getStatistics } from "../sentinelhub/getStatistics_CDSE";
import { getImage } from "../sentinelhub/getImage_CDSE";
import * as imageDataRef from "../utils/image/getImageData";
import * as dateTime from "../utils/dateTime";
import * as mongodb from "../mongo/mongodb";
import growingSeason from "../settings/growingSeason.json";
import isDateInGrowingSeason from "../utils/isdateingrowingseason";
import { SentinelRequest } from "../sentinelhub/sentinelhub_token";
import { IImage } from '../types';
import { getWeatherFromDbOrFetch } from '../services/weatherService';
import { getUserId } from '../utils/getTokenUserId';
import { getGrowingSeasons } from '../utils/growingSeasonUtils';

interface JwtPayload {
  _id: string;
  username: string;
}

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

// ============================================================
// p-limit korvaaja (toimii CommonJS + Docker)
// ============================================================

function createLimit(concurrency: number) {
  let activeCount = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const fn = queue.shift();
      if (fn) fn();
    }
  };

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        activeCount++;
        fn()
          .then((val) => { resolve(val); next(); })
          .catch((err) => { reject(err); next(); });
      };

      if (activeCount < concurrency) {
        run();
      } else {
        queue.push(run);
      }
    });
  };
}

// ============================================================
// Helpers
// ============================================================

const getSentinelDates = async (
  geometry: any,
  fromTime: Date | null,
  toTime: Date,
  authToken: string
): Promise<SentinelDate[]> => {
  let data: SentinelDate[] = [];
  let stats: SentinelStat[] = [];

  try {
    stats = await getStatistics(
      geometry,
      fromTime?.toISOString() ?? "",
      toTime.toISOString(),
      authToken
    ) as unknown as SentinelStat[];
  } catch (e: any) {
    console.error("#### Error fetching statistics: ", e.error ? e.error.message : e.message);
    return data;
  }

  if (stats && stats.length > 0) {
    console.log("stats:", stats);
    const reversedStats = [...stats].reverse();
    for (const stat of reversedStats) {
      // Suodatetaan kasvukauden ulkopuoliset pois
      if (!isDateInGrowingSeason(stat.interval.from, growingSeason)) continue;

      const statRef = stat.outputs.ndvi.bands.B0.stats;
      if (statRef.mean >= 0.1) {
        data.push({
          generationtime: stat.interval.from,
          stats: {
            average: statRef.mean,
            max: statRef.max,
            min: statRef.min,
            std: statRef.stDev,
          },
          sentinelid: stat.interval.from + "_" + hash.sha256(geometry),
          ndviClassPercentages: stat.ndviClassPercentages,
        });
      }
    }
  } else {
    console.log("No data for the geometry", fromTime, " - ", toTime);
  }

  return data;
};

const getImageWithData = async (item: SentinelDate, geometry: any, authToken: string): Promise<any> => {
  const image = await getImage(item.generationtime, geometry, authToken);
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
  authToken: string,
  name: string = '',
  userId: string = '',
  kasvulohkot: any[] = []
): Promise<boolean> => {
  const id = hash.sha256(geometry);
  const area = geoUtils.getAreaFromGeometry(geometry);
  type SentinelDatesWithoutPercentages = Omit<SentinelDate, "ndviClassPercentages">;
  let savedDates: SentinelDatesWithoutPercentages[] = [];
  let res: any = null;

  try {
    if (save) {
      res = await mongodb.saveDates(id, savedDates, geometry, area ?? 0, name, userId, kasvulohkot);
    }

    const startTime = performance.now();
    const dates = await getSentinelDates(geometry, fromTime, toTime, authToken);
    console.log(dates.length, " STATISTICS ElapsedTime (sec): ", (performance.now() - startTime) / 1000);

    if (dates.length > 0) {
      const startTime = performance.now();
      const limit = createLimit(5);

      await Promise.all(
        dates.map(item =>
          limit(async () => {
            const _data = await getImageWithData(item, geometry, authToken);
            if (_data) await mongodb.saveImage(_data);
          })
        )
      );

      savedDates = dates.map(({ ndviClassPercentages, ...rest }) => rest);
      savedDates = dateTime.sortByDateTime(savedDates, "generationtime", "desc");
      res = await mongodb.updateDates(id, savedDates, userId);
      console.log(dates.length, " IMAGES ElapsedTime (sec): ", (performance.now() - startTime) / 1000);
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
  authToken: string,
  name: string = '',
  userId: string = '',
  kasvulohkot: any[] = []
): Promise<any> {
  const id = hash.sha256(geometry);
  let data = await mongodb.getDates(id);

  console.log('getDates: data in db:', data?.dates?.length ?? 0, 'dates');
  console.log('getDates: fromTime:', fromTime, 'toTime:', toTime);

  if (!data || !data.dates || data.dates.length === 0) {
    console.log('getDates: no data, fetching all');
    await saveSentinelDataToMongo(true, geometry, fromTime, toTime, authToken, name, userId, kasvulohkot);
  } else {
    console.log('getDates: newest:', data.dates[0].generationtime);
    console.log('getDates: oldest:', data.dates[data.dates.length - 1].generationtime);
    console.log('getDates: zeroDateTime(toTime):', dateTime.zeroDateTime(toTime));

    // Hae uudempaa dataa jos uusin tallennettu on ennen toTimea
    if (data.dates[0].generationtime < dateTime.zeroDateTime(toTime)) {
      const newFromTime = new Date(dateTime.addOneDay(data.dates[0].generationtime));
      console.log('getDates: fetching newer from:', newFromTime);
      await saveSentinelDataToMongo(false, geometry, newFromTime, toTime, authToken, name, userId);
    }

    // Hae vanhempaa dataa jos fromTime on ennen vanhinta tallennettua
    const oldestDate = data.dates[data.dates.length - 1]?.generationtime;
    if (fromTime && oldestDate && new Date(fromTime) < new Date(oldestDate)) {
      const backfillToTime = new Date(oldestDate);
      console.log('getDates: fetching older from:', fromTime, 'to:', backfillToTime);
      await saveSentinelDataToMongo(false, geometry, fromTime, backfillToTime, authToken, name, userId);
    }

    // Päivitä metadata
    if (kasvulohkot.length > 0 && (!data.kasvulohkot || data.kasvulohkot.length === 0)) {
      await mongodb.saveDates(id, data.dates, geometry, data.area ?? 0, name || data.name, userId, kasvulohkot);
    } else if ((name && !data.name) || (userId && !data.userIds?.includes(userId))) {
      await mongodb.saveDates(id, data.dates, geometry, data.area ?? 0, name || data.name, userId);
    }
  }

  if (returnData) {
    return await mongodb.getDates(id);
  }
  return null;
}

// ============================================================
// dates route handler
// ============================================================

export const dates = async (req: SentinelRequest, res: Response, next: NextFunction): Promise<void> => {
  const authToken = req.authToken ?? '';
  const startTime = performance.now();

  let geometry: any = null;
  try {
    const raw = typeof req.body.geometry !== "object"
      ? JSON.parse(req.body.geometry)
      : req.body.geometry;
    geometry = rewind(raw, { mutate: false });
  } catch (e) { }

  const fromTime = new Date(req.body.start_date);
  const name = req.body.name ?? '';
  const userId = getUserId(req);
  const kasvulohkot = req.body.kasvulohkot ?? [];

  const fromYear = fromTime.getFullYear();
  const toYear = new Date().getFullYear();
  const seasons = getGrowingSeasons(fromYear, toYear);

  if (seasons.length === 0) {
    res.status(404).send("no data available");
    return;
  }

  const sentinelFrom = seasons[0].start;
  const sentinelTo = seasons[seasons.length - 1].end;

  const data = await getDates(true, geometry, sentinelFrom, sentinelTo, authToken, name, userId, kasvulohkot);
  console.log("Request handled in (sec): ", (performance.now() - startTime) / 1000);

  // Sää: rinnakkain kasvukausittain
  const wStart = performance.now();
  await Promise.all(
    seasons.map(({ start, end }) =>
      getWeatherFromDbOrFetch(geometry, start, end)
    )
  );
  console.log("Weather saved in (sec): ", (performance.now() - wStart) / 1000);

  if (data) {
    res.status(200).send(data);
  } else {
    res.status(404).send("no data available");
  }
};

// ============================================================
// Image handlers
// ============================================================

interface RawImageData {
  dataUrl: { buffer: Buffer };
  minX: number; minY: number; maxX: number; maxY: number;
}

interface ProcessedImageData extends Omit<RawImageData, 'dataUrl'> {
  dataUrl: string;
}

export const image = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.sentinelid;
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