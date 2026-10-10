"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldParcel = void 0;
const mongoose_1 = require("mongoose");
const connections_1 = require("../connections");
const FieldParcelSchema = new mongoose_1.Schema({
    tunnus: { type: String },
    peruslohkotunnus: { type: String },
    vuosi: { type: String },
    pinta_ala: { type: Number },
    luomuviljely: { type: String },
    geometry: {
        type: { type: String, enum: ["Polygon", "MultiPolygon"] },
        coordinates: { type: mongoose_1.Schema.Types.Mixed },
    },
}, {
    collection: "fieldparcels",
});
FieldParcelSchema.index({ peruslohkotunnus: 1, vuosi: 1 }, { unique: true });
FieldParcelSchema.index({ geometry: "2dsphere" });
const FieldParcelModel = connections_1.parcelConnection.model("FieldParcel", FieldParcelSchema);
exports.FieldParcel = FieldParcelModel;
