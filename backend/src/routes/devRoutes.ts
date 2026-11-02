// routes/devRoutes.ts
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const JSONStream = require("JSONStream");
import { FieldParcel } from "../mongo/models/FieldParcel";
import { CropParcel } from "../mongo/models/CropParcel";
import { CropType } from "../mongo/models/CropType";

let cropImportRunning = false;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


async function insertBatchWithRetry(model: any, docs: any[], label: string, maxAttempts = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await model.insertMany(docs, { ordered: false });
      return true;
    } catch (e: any) {
      const writeErrors = e.writeErrors ?? [];
      const codeOf = (w: any) => w.err?.code ?? w.code;
      const permanent = writeErrors.length > 0 &&
        writeErrors.every((w: any) => codeOf(w) === 11000 || codeOf(w) === 16755);

      if (permanent) {
        const bad = writeErrors
          .filter((w: any) => codeOf(w) === 16755)
          .map((w: any) => docs[w.err?.index ?? w.index])
          .filter(Boolean);
        if (bad.length > 0) {
          fs.appendFileSync("invalid_geometries.jsonl", bad.map((d: any) => JSON.stringify(d)).join("\n") + "\n");
          console.log(`${label}: ${bad.length} virheellistä geometriaa tallennettu invalid_geometries.jsonl`);
        }
        return true;
      }
      console.error(`${label}: yritys ${attempt}/${maxAttempts}: ${e.name} ${e.code ?? ""} ${String(e.message).slice(0, 150)}`);
      await sleep(5000 * attempt);
    }
  }
  return false;
}

const router = Router();

// ─────────────────────────────────────────
// PELTOLOHKOT
// ──────────────────────────────────────
// 

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
        tunnus: doc.tunnus,
        peruslohkotunnus: doc.peruslohkotunnus,
        vuosi: doc.vuosi,
        pinta_ala: doc.pinta_ala ? parseFloat(doc.pinta_ala) : null,
        luomuviljely: doc.luomuviljely,
        geometry: doc.geometry,
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

async function loadExistingKeys(vuosi: string): Promise<Set<string>> {
  const keys = new Set<string>();
  const PAGE = 10000;
  let from = "";

  while (true) {
    let page: any[] | null = null;

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        page = await CropParcel.find(
          { peruslohkotunnus: { $gte: from } },
          { _id: 0, peruslohkotunnus: 1, lohkonumero: 1, vuosi: 1 }
        )
          .sort({ peruslohkotunnus: 1, lohkonumero: 1, vuosi: 1 })
          .hint({ peruslohkotunnus: 1, lohkonumero: 1, vuosi: 1 })
          .limit(PAGE)
          .lean()
          .maxTimeMS(300000);
        break;
      } catch (e: any) {
        console.error(`Avainten haku: yritys ${attempt}/5: ${e.name} ${String(e.message).slice(0, 100)}`);
        await sleep(5000 * attempt);
      }
    }
    if (page === null) throw new Error("Avainten haku epäonnistui");
    if (page.length === 0) break;

    const full = page.length === PAGE;
    const last = page[page.length - 1].peruslohkotunnus;

    for (const d of page) {
      if (full && d.peruslohkotunnus === last) continue; // haetaan uudelleen seuraavalla sivulla
      if (d.vuosi === vuosi) keys.add(`${d.peruslohkotunnus}|${d.lohkonumero}`);
    }
    if (!full) break;
    from = last;
    if (keys.size % 100000 < PAGE) console.log(`Avaimia haettu: ${keys.size}`);
  }
  return keys;
}

router.post("/import-CropParcels", async (req: Request, res: Response) => {
  const startTime = performance.now();
  const vuosiParam = req.query.vuosi ? String(req.query.vuosi) : null;
  const filePath = process.env.KASVULOHKO_FILE_PATH
    || `D:\\Peltolohkot_kasvulohkot\\kasvulohkot_${vuosiParam ?? "2025"}.json`;

  if (cropImportRunning) {
    console.log("⛔ Tuonti on jo käynnissä, uusi pyyntö hylätty");
    return res.status(409).json({ error: "Tuonti on jo käynnissä" });
  }
  cropImportRunning = true;
  console.log(`▶ Tuonti käynnistyi: vuosi=${vuosiParam ?? "-"}, tiedosto=${filePath}`);

  try {
    const BATCH = 500;
    const skipExisting = req.query.skipExisting === "true" && vuosiParam !== null;

    let existing = new Set<string>();
    if (skipExisting) {
      console.log(`Haetaan jo kannassa olevat avaimet (vuosi ${vuosiParam})...`);
      existing = await loadExistingKeys(vuosiParam!);
      console.log(`Kannassa jo: ${existing.size}`);
    }

    let batch: any[] = [];
    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    const pipeline = fs.createReadStream(filePath).pipe(JSONStream.parse("*"));

    await new Promise<void>((resolve, reject) => {
      pipeline.on("data", async (doc: any) => {
        if (skipExisting && existing.has(`${doc.peruslohkotunnus}|${doc.lohkonumero}`)) {
          skipped++;
          return;
        }

        batch.push({
          tunnus: doc.tunnus,
          peruslohkotunnus: doc.peruslohkotunnus,
          lohkonumero: doc.lohkonumero,
          vuosi: String(doc.vuosi),
          pinta_ala: doc.pinta_ala ? parseFloat(doc.pinta_ala) : null,
          kasvikoodi: doc.kasvikoodi,
          luomuviljely: doc.luomuviljely,
          geometry: doc.geometry,
        });

        if (batch.length >= BATCH) {
          pipeline.pause();
          const toInsert = batch.splice(0, BATCH);
          const ok = await insertBatchWithRetry(CropParcel, toInsert, "Kasvulohkot");
          if (ok) inserted += toInsert.length;
          else failed += toInsert.length;
          console.log(`Kasvulohkot inserted: ${inserted} | ohitettu: ${skipped} | epäonnistui: ${failed}`);
          pipeline.resume();
        }
      });

      pipeline.on("end", async () => {
        if (batch.length > 0) {
          const ok = await insertBatchWithRetry(CropParcel, batch, "Kasvulohkot (loppu)");
          if (ok) inserted += batch.length;
          else failed += batch.length;
        }
        console.log(`Kasvulohkot total: ${inserted} | ohitettu: ${skipped} | epäonnistui: ${failed}`);
        resolve();
      });
      pipeline.on("error", reject);
    });

    console.log("ElapsedTime (sec): ", (performance.now() - startTime) / 1000);
    res.json({ inserted, skipped, failed });
  } finally {
    cropImportRunning = false;
  }
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