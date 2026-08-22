import { Schema } from "mongoose";
import { localConnection } from "../connections";

const FieldParcelSchema = new Schema({
  tunnus:            { type: String, index: true },
  peruslohkotunnus:  { type: String, index: true },
  vuosi:             { type: String },
  pinta_ala:         { type: Number },
  luomuviljely:      { type: String },
  geometry: {
    type:        { type: String, enum: ["Polygon", "MultiPolygon"] },
    coordinates: { type: Schema.Types.Mixed },
  },
}, {
  collection: "fieldparcels",
});

FieldParcelSchema.index({ geometry: "2dsphere" });

const FieldParcelModel = localConnection.model("FieldParcel", FieldParcelSchema);
export { FieldParcelModel as FieldParcel };