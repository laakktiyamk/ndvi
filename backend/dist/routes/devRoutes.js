"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/devRoutes.ts
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const JSONStream = require("JSONStream");
const FieldParcel_1 = require("../mongo/models/FieldParcel");
const CropParcel_1 = require("../mongo/models/CropParcel");
const CropType_1 = require("../mongo/models/CropType");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// PELTOLOHKOT
// ─────────────────────────────────────────
router.post("/import-FieldParcels", async (req, res) => {
    const startTime = performance.now();
    const filePath = process.env.PELTOLOHKO_FILE_PATH || "D:\\Peltolohkot_kasvulohkot\\peltolohkot.json";
    const BATCH = 500;
    let batch = [];
    let inserted = 0;
    const pipeline = fs_1.default.createReadStream(filePath).pipe(JSONStream.parse("*"));
    await new Promise((resolve, reject) => {
        pipeline.on("data", async (doc) => {
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
                    await FieldParcel_1.FieldParcel.insertMany(toInsert, { ordered: false });
                    inserted += toInsert.length;
                    console.log(`Peltolohkot inserted: ${inserted}`);
                }
                catch (e) {
                    console.error(e);
                }
                pipeline.resume();
            }
        });
        pipeline.on("end", async () => {
            if (batch.length > 0) {
                await FieldParcel_1.FieldParcel.insertMany(batch, { ordered: false });
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
router.post("/import-CropParcels", async (req, res) => {
    const startTime = performance.now();
    const filePath = process.env.KASVULOHKO_FILE_PATH || "D:\\Peltolohkot_kasvulohkot\\kasvulohkot.json";
    const BATCH = 500;
    let batch = [];
    let inserted = 0;
    const pipeline = fs_1.default.createReadStream(filePath).pipe(JSONStream.parse("*"));
    await new Promise((resolve, reject) => {
        pipeline.on("data", async (doc) => {
            batch.push({
                tunnus: doc.tunnus,
                peruslohkotunnus: doc.peruslohkotunnus,
                lohkonumero: doc.lohkonumero,
                pinta_ala: doc.pinta_ala ? parseFloat(doc.pinta_ala) : null,
                kasvikoodi: doc.kasvikoodi,
                luomuviljely: doc.luomuviljely,
                geometry: doc.geometry,
            });
            if (batch.length >= BATCH) {
                pipeline.pause();
                const toInsert = batch.splice(0, BATCH);
                try {
                    await CropParcel_1.CropParcel.insertMany(toInsert, { ordered: false });
                    inserted += toInsert.length;
                    console.log(`Kasvulohkot inserted: ${inserted}`);
                }
                catch (e) {
                    console.error(e);
                }
                pipeline.resume();
            }
        });
        pipeline.on("end", async () => {
            if (batch.length > 0) {
                await CropParcel_1.CropParcel.insertMany(batch, { ordered: false });
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
router.post("/import-CropTypes", async (req, res) => {
    const filePath = process.env.KASVILAJIT_FILE_PATH || "D:\\Peltolohkot_kasvulohkot\\kasvilajit.json";
    const docs = JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
    const docsWithColor = docs.map((doc) => ({
        ...doc,
        color: doc.color ?? generateCropColor(doc.kasvikoodi),
    }));
    await CropType_1.CropType.insertMany(docsWithColor, { ordered: false });
    res.json({ inserted: docsWithColor.length });
});
function generateCropColor(kasvikoodi) {
    let hash = 0;
    for (const char of kasvikoodi) {
        hash = char.charCodeAt(0) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
}
exports.default = router;
