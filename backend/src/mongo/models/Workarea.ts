import mongoose, { Document, Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

/**
 * Represents a GeoJSON geometry object stored in the workarea.
 */
interface IGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

/**
 * Represents a workarea document stored in MongoDB.
 *
 * @remarks
 * This model contains:
 * - unique configuration and database IDs (`id`, `workareaid`)
 * - display names and organizational markers (`name`, `backofficeid`)
 * - the geographical boundaries (`geometry`)
 * - an activation flag for NDVI tracking (`ndvi`)
 */
interface IWorkarea extends Document {
  /** Unique hash identifier for the workarea. */
  id: string;

  /** External or operational unique ID for the workarea. */
  workareaid: string;

  /** Public display name of the workarea. */
  name: string;

  /** Identifier connecting this workarea to a backoffice entity. */
  backofficeid: string;

  /** Geographical boundaries of the workarea in GeoJSON format. */
  geometry: IGeometry;

  /** Flag indicating whether NDVI analysis is enabled for this area. */
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
    unique: false,
  },
  backofficeid: {
    type: String,
    required: true,
    unique: false,
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

// Attach the unique validator plugin to enforce unique constraints safely
WorkareaSchema.plugin(uniqueValidator);

/**
 * Mongoose model for workareas.
 */
const WorkareaModel: mongoose.Model<IWorkarea> = mongoose.model<IWorkarea>("Workarea", WorkareaSchema);

export { WorkareaModel as Workarea, IWorkarea };