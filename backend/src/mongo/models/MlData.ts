import { Schema } from "mongoose";
import { parcelConnection } from "../connections";

const MlDataSchema = new Schema({
  // Tunnisteet
  geometryHash: { type: String, required: true },
  batchId: { type: String },

  // Lähdepelto (Ruokavirasto)
  peruslohkotunnus: { type: String },
  vuosi: { type: String },
  pinta_ala: { type: Number },

  // Geometria
  geometry: {
    type: { type: String, enum: ["Polygon", "MultiPolygon"] },
    coordinates: { type: Schema.Types.Mixed },
  },

  // Havaintojen määrä kasvukausittain, esim. [{ year: 2020, count: 14 }, ...]
  seasonCounts: { type: [Schema.Types.Mixed], default: [] },
  // Peltolohkon sisällä olevat kasvulohkot (kasvikoodi per lohko)
  kasvulohkot: { type: [Schema.Types.Mixed], default: [] },
  
  // NDVI-aikasarja
  dates: { type: [Schema.Types.Mixed], default: [] },
}, {
  collection: "ML_data",
  timestamps: true,
});

MlDataSchema.index({ geometryHash: 1 }, { unique: true });
MlDataSchema.index({ batchId: 1 });
MlDataSchema.index({ geometry: "2dsphere" });

const MlDataModel = parcelConnection.model("MlData", MlDataSchema);
export { MlDataModel as MlData };