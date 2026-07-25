import mongoose, { Document, Schema } from "mongoose";

/**
 * Represents a GeoJSON geometry object stored in the workarea.
 */
interface IGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

/**
 * Represents a workarea document stored in MongoDB.
 */
interface IWorkarea extends Document {
  id: string;
  workareaid: string;
  name: string;
  backofficeid: string;
  geometry: IGeometry;
  ndvi: boolean;
}

/**
 * Mongoose schema defining the structure of a workarea document.
 */
const WorkareaSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  workareaid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  backofficeid: {
    type: String,
    required: true,
  },
  geometry: {
    type: Object,
    required: true,
    unique: true,
  },
  ndvi: {
    type: Boolean,
    default: false,
  }
});

// 🔥 Plugin poistettu — ei ESM-ongelmia
// WorkareaSchema.plugin(uniqueValidator);

/**
 * Mongoose model for workareas.
 */
const WorkareaModel: mongoose.Model<IWorkarea> = mongoose.model<IWorkarea>("Workarea", WorkareaSchema);

export { WorkareaModel as Workarea, IWorkarea };
