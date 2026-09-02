import { Schema } from "mongoose";
import { localConnection } from "../connections";

const CropParcelSchema = new Schema({
  tunnus:                { type: String },
  peruslohkotunnus:      { type: String },
  lohkonumero:           { type: String },
  vuosi:                 { type: String },
  pinta_ala:             { type: Number },
  kasvikoodi:            { type: String },  
  luomuviljely:          { type: String },
  geometry: {
    type:        { type: String, enum: ["Polygon", "MultiPolygon"] },
    coordinates: { type: Schema.Types.Mixed },
  },
}, {
  collection: "cropParcels",
});

CropParcelSchema.index({ peruslohkotunnus: 1, lohkonumero: 1, vuosi: 1 }, { unique: true });
CropParcelSchema.index({ kasvikoodi: 1 });
CropParcelSchema.index({ geometry: "2dsphere" });

const CropParcelModel = localConnection.model("CropParcel", CropParcelSchema);
export { CropParcelModel as CropParcel };