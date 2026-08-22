// routes/devRoutes.ts
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const JSONStream = require("JSONStream");
import { FieldParcel } from "../mongo/models/FieldParcel";

const router = Router();

router.post("/import-FieldParcels", async (req: Request, res: Response) => {

  const startTime = performance.now();
   
  const filePath = process.env.PELTOLOHKO_FILE_PATH || "D:\\Peltolohkot_kasvulohkot\\peltolohkot.json";
  const BATCH = 500;
  let batch: any[] = [];
  let inserted = 0;


const pipeline = fs.createReadStream(filePath).pipe(JSONStream.parse("*"));
  

  await new Promise<void>((resolve, reject) => {
  
    pipeline.on("data", async (value: any) => {
      
      console.log("RAW value:", JSON.stringify(value).slice(0, 200));
      batch.push({ geometry: value });

      if (batch.length >= BATCH) {
        pipeline.pause();
        const toInsert = batch.splice(0, BATCH);
        try {
          await FieldParcel.insertMany(toInsert, { ordered: false });
          
          inserted += toInsert.length;
          console.log(`Would insert: ${inserted}, sample:`, JSON.stringify(toInsert[0]).slice(0, 100));
        } catch (e) {
          console.error(e);
        }
        pipeline.resume();
      }
    });

    pipeline.on("end", async () => {
      if (batch.length > 0) {
        await FieldParcel.insertMany(batch, { ordered: false });
        inserted += batch.length;
      }
      console.log(`Total would insert: ${inserted}`);
      resolve();
    });
    pipeline.on("error", reject);
  });

  console.log("ElapsedTime (sec): ", (performance.now() - startTime) / 1000);
  res.json({ inserted });
});

export default router;