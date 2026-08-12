// routes/devRoutes.ts
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { chain } from "stream-json/streamers/StreamArray";
import { Peltolohko } from "../models/Peltolohko";

const router = Router();

router.post("/import-peltolohkot", async (req: Request, res: Response) => {
  const filePath = path.resolve("geometries.json");
  const BATCH = 500;
  let batch: any[] = [];
  let inserted = 0;

  const pipeline = fs.createReadStream(filePath).pipe(chain());

  await new Promise<void>((resolve, reject) => {
    pipeline.on("data", async ({ value }) => {
      batch.push({ geometry: value });

      if (batch.length >= BATCH) {
        pipeline.pause();
        const toInsert = batch.splice(0, BATCH);
        try {
          await Peltolohko.insertMany(toInsert, { ordered: false });
          inserted += toInsert.length;
          console.log(`Inserted: ${inserted}`);
        } catch (e) {
          console.error(e);
        }
        pipeline.resume();
      }
    });

    pipeline.on("end", async () => {
      if (batch.length > 0) {
        await Peltolohko.insertMany(batch, { ordered: false });
        inserted += batch.length;
      }
      resolve();
    });

    pipeline.on("error", reject);
  });

  res.json({ inserted });
});

export default router;