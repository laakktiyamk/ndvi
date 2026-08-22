import { Schema } from "mongoose";
import { localConnection } from "../connections";

const CropParcelSchema = new Schema({
  tunnus:                { type: String, index: true },
  peruslohkotunnus:      { type: String, index: true },  // linkki peltolohkoon
  lohkonumero:           { type: String },
  pinta_ala:             { type: Number },
  kasvikoodi:            { type: String, index: true },
  kasvikoodi_selite_fi:  { type: String },
  luomuviljely:          { type: String },
  geometry: {
    type:        { type: String, enum: ["Polygon", "MultiPolygon"] },
    coordinates: { type: Schema.Types.Mixed },
  },
}, {
  collection: "cropParcels",
});

CropParcelSchema.index({ geometry: "2dsphere" });
CropParcelSchema.index({ peruslohkotunnus: 1, kasvikoodi: 1 });

const CropParcelModel = localConnection.model("CropParcel", CropParcelSchema);
export { CropParcelModel as CropParcel };