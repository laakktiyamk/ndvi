// routes/devRoutes.ts
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const JSONStream = require("JSONStream");
import { FieldParcel } from "../mongo/models/FieldParcel";
import { CropParcel } from "../mongo/models/CropParcel";
import { CropType } from "../mongo/models/CropType";

const router = Router();

// ─────────────────────────────────────────
// PELTOLOHKOT
// ─────────────────────────────────────────

router.post("/import-FieldParcels", async (req: Request, res: Response) => {
  const startTime = performance.now();
  const filePath = process.env.PELTOLOHKO_FILE_PATH || "D:\\Peltolohkot_kasvulohkot\\peltolohkot.json";
  const BATCH = 500;
  let batch: any[] = [];
  let inserted = 0;

  const pipeline = fs.createReadStream(filePath).pipe(JSONStream.parse("*"));

  await new Promise<void>((resolve, reject) => {
    pipeline.on("data", async (doc: any) => {
      batch.push({
        tunnus:           doc.tunnus,
        peruslohkotunnus: doc.peruslohkotunnus,
        vuosi:            doc.vuosi,
        pinta_ala:        doc.pinta_ala ? parseFloat(doc.pinta_ala) : null,
        luomuviljely:     doc.luomuviljely,
        geometry:         doc.geometry,
      });

      if (batch.length >= BATCH) {
        pipeline.pause();
        const toInsert = batch.splice(0, BATCH);
        try {
          await FieldParcel.insertMany(toInsert, { ordered: false });
          inserted += toInsert.length;
          console.log(`Peltolohkot inserted: ${inserted}`);
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
      console.log(`Peltolohkot total: ${inserted}`);
      resolve();
    });
    pipeline.on("error", reject);
  });

  console.log("ElapsedTime (sec): ", (performance.now() - startTime) / 1000);
  res.json({ inserted });
});

// ─────────────────────────────────────────
// KASVULOHKOT
// ─────────────────────────────────────────

router.post("/import-CropParcels", async (req: Request, res: Response) => {
  const startTime = performance.now();
  const filePath = process.env.KASVULOHKO_FILE_PATH || "D:\\Peltolohkot_kasvulohkot\\kasvulohkot.json";
  const BATCH = 500;
  let batch: any[] = [];
  let inserted = 0;

  const pipeline = fs.createReadStream(filePath).pipe(JSONStream.parse("*"));

  await new Promise<void>((resolve, reject) => {
    pipeline.on("data", async (doc: any) => {
      batch.push({
        tunnus:               doc.tunnus,
        peruslohkotunnus:     doc.peruslohkotunnus,
        lohkonumero:          doc.lohkonumero,
        pinta_ala:            doc.pinta_ala ? parseFloat(doc.pinta_ala) : null,
        kasvikoodi:           doc.kasvikoodi,        
        luomuviljely:         doc.luomuviljely,
        geometry:             doc.geometry,
      });

      if (batch.length >= BATCH) {
        pipeline.pause();
        const toInsert = batch.splice(0, BATCH);
        try {
          await CropParcel.insertMany(toInsert, { ordered: false });
          inserted += toInsert.length;
          console.log(`Kasvulohkot inserted: ${inserted}`);
        } catch (e) {
          console.error(e);
        }
        pipeline.resume();
      }
    });

    pipeline.on("end", async () => {
      if (batch.length > 0) {
        await CropParcel.insertMany(batch, { ordered: false });
        inserted += batch.length;
      }
      console.log(`Kasvulohkot total: ${inserted}`);
      resolve();
    });
    pipeline.on("error", reject);
  });

  console.log("ElapsedTime (sec): ", (performance.now() - startTime) / 1000);
  res.json({ inserted });
});


router.post("/import-CropTypes", async (req: Request, res: Response) => {

  const filePath = process.env.KASVILAJIT_FILE_PATH || "D:\\Peltolohkot_kasvulohkot\\kasvilajit.json";
  const docs = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const docsWithColor = docs.map((doc: any) => ({
    ...doc,
    color: doc.color ?? generateCropColor(doc.kasvikoodi),
  }));

  await CropType.insertMany(docsWithColor, { ordered: false });
  res.json({ inserted: docsWithColor.length });
});

function generateCropColor(kasvikoodi: string): string {
  let hash = 0;
  for (const char of kasvikoodi) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
}

export default router;