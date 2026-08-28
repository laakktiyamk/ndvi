import mongoose, { Document, Schema } from "mongoose";

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

export interface IKasvulohko {
  tunnus: string;
  lohkonumero: string;
  kasvikoodi: string;
  kasvikoodi_selite_fi: string;
  pinta_ala: number;
  luomuviljely: string;
}

export interface IDates extends Document {
  id: string;
  name: string;
  userIds: string[];
  dates: IDateItem[];
  geometry: IGeometry;
  area: number;
  kasvulohkot: IKasvulohko[];
}

const DatesSchema: Schema = new Schema({
  id:          { type: String, required: true, unique: true },
  name:        { type: String, default: '' },
  userIds:     { type: [String], default: [] },
  dates:       { type: Array, default: [] },
  geometry:    { type: Object, required: true, unique: true },
  area:        { type: Number },
  kasvulohkot: { type: Array, default: [] },  // ← lisäys
});

const DatesModel: mongoose.Model<IDates> = mongoose.model<IDates>("Dates", DatesSchema);

export { DatesModel as Dates };