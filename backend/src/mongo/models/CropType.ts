import { Schema } from "mongoose";
import { localConnection } from "../connections";

const CropTypeSchema = new Schema({
  kasvikoodi:           { type: String, unique: true, index: true },  
  color:                { type: String, default: null },
}, {
  collection: "cropTypes",
});

const CropTypeModel = localConnection.model("CropType", CropTypeSchema);
export { CropTypeModel as CropType };