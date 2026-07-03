import mongoose, { Document, Schema } from "mongoose";
import { IWeather } from "../../types";

const weatherSchema = new Schema<IWeather>({
  sentinelid: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  geometryHash: { type: String, required: true },
  temperature_2m_mean: { type: Number, default: null },
  precipitation_sum: { type: Number, default: null },
  shortwave_radiation_sum: { type: Number, default: null },
  et0_fao_evapotranspiration: { type: Number, default: null },
});

const WeatherModel: mongoose.Model<IWeather> = mongoose.model<IWeather>("Weather", weatherSchema);

export { WeatherModel as Weather };