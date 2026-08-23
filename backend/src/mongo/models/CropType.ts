import { Schema } from "mongoose";
import { localConnection } from "../connections";

const CropTypeSchema = new Schema({
  kasvikoodi:           { type: String, unique: true, index: true },
  kasvikoodi_selite_fi: { type: String },
  color:                { type: String, default: null },
}, {
  collection: "cropTypes",
});

const CropTypeModel = localConnection.model("CropType", CropTypeSchema);
export { CropTypeModel as CropType };