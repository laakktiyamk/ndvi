import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_AZURE_URI;
if (!uri) throw new Error("MONGO_AZURE_URI puuttuu");

// Local/Azure — peltolohkot, kasvulohkot, ML_data
export const parcelConnection = mongoose.createConnection(uri, {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 8000,
});

parcelConnection.on("connected", () => console.log("Parcel DB: connected"));
parcelConnection.on("error", (err: Error) => console.error("Parcel DB error:", err));

export const ensureLocalConnected = () => parcelConnection.asPromise();