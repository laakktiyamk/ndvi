import mongoose, { Document, Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

interface IDateItem {
  generationtime: string;
  stats: {
    average: number;
    max: number;
    min: number;
    std: number;
  };
  sentinelid: string;
}

interface IGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

interface IDates extends Document {
  id: string;
  name: string;
  userIds: string[];    // ← array, useampi käyttäjä voi omistaa saman geometrian
  dates: IDateItem[];
  geometry: IGeometry;
  area: number;
}

const DatesSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  userIds: { type: [String], default: [] },  // ← lisätty
  dates: { type: Array, default: [] },
  geometry: { type: Object, required: true, unique: true },
  area: { type: Number },
});

DatesSchema.plugin(uniqueValidator);

const DatesModel: mongoose.Model<IDates> = mongoose.model<IDates>("Dates", DatesSchema);

export { DatesModel as Dates, IDates };
