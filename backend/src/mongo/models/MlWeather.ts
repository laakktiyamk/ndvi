import { Schema } from "mongoose";
import { parcelConnection } from "../connections";
import type { IWeather } from "../../types";
import type { WeatherStore } from "../../services/weatherService";

const MlWeatherSchema = new Schema({
  sentinelid:                 { type: String, required: true },
  geometryHash:               { type: String, required: true },
  date:                       { type: Date, required: true },
  temperature_2m_mean:        { type: Number, default: null },
  temperature_2m_max:         { type: Number, default: null },
  temperature_2m_min:         { type: Number, default: null },
  precipitation_sum:          { type: Number, default: null },
  shortwave_radiation_sum:    { type: Number, default: null },
  et0_fao_evapotranspiration: { type: Number, default: null },
  relative_humidity_2m_mean:  { type: Number, default: null },
  wind_speed_10m_mean:        { type: Number, default: null },
}, {
  collection: "ML_weather",
});

MlWeatherSchema.index({ sentinelid: 1 }, { unique: true });
MlWeatherSchema.index({ geometryHash: 1, date: 1 });

const MlWeatherModel = parcelConnection.model("MlWeather", MlWeatherSchema);

// ML-ajon säädatan tallennus Azureen (WeatherStore, ks. weatherService.ts)
export const mlWeatherStore: WeatherStore = {
    saveMany: async (items: IWeather[]) => {
    if (items.length === 0) return;
    await MlWeatherModel.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { sentinelid: item.sentinelid },
          update: { $set: { ...item, date: new Date(item.date) } },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  },
  getByRange: async (geometryHash: string, start: Date, end: Date) => {
    const rows = await MlWeatherModel
      .find({ geometryHash, date: { $gte: start, $lte: end } })
      .sort({ date: 1 })
      .lean();
    return rows as unknown as IWeather[];
  },
};

export { MlWeatherModel as MlWeather };