"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CropParcel = void 0;
const mongoose_1 = require("mongoose");
const connections_1 = require("../connections");
const CropParcelSchema = new mongoose_1.Schema({
    tunnus: { type: String },
    peruslohkotunnus: { type: String },
    lohkonumero: { type: String },
    vuosi: { type: String },
    pinta_ala: { type: Number },
    kasvikoodi: { type: String },
    luomuviljely: { type: String },
    geometry: {
        type: { type: String, enum: ["Polygon", "MultiPolygon"] },
        coordinates: { type: mongoose_1.Schema.Types.Mixed },
    },
}, {
    collection: "cropParcels",
});
CropParcelSchema.index({ peruslohkotunnus: 1, lohkonumero: 1, vuosi: 1 }, { unique: true });
CropParcelSchema.index({ kasvikoodi: 1 });
CropParcelSchema.index({ geometry: "2dsphere" });
const CropParcelModel = connections_1.parcelConnection.model("CropParcel", CropParcelSchema);
exports.CropParcel = CropParcelModel;
