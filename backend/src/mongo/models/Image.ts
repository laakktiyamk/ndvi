import mongoose, { Document, Schema } from "mongoose";
import { IImage } from '../../types';

/**
 * Mongoose schema defining the structure of an image document.
 */
const ImageSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true   // MongoDB hoitaa uniikkiuden
  },
  average: { type: Number },
  max: { type: Number },
  min: { type: Number },
  std: { type: Number },
  image: {
    minX: { type: Number },
    minY: { type: Number },
    maxX: { type: Number },
    maxY: { type: Number },
    dataUrl: { type: Schema.Types.Buffer }
  },
  scale: { type: Array, default: [] }
});

/**
 * Mongoose model for satellite images.
 */
const ImageModel: mongoose.Model<IImage> = mongoose.model<IImage>("Image", ImageSchema);

export { ImageModel as Image, IImage };