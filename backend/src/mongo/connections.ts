import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Atlas — users, ndvi-data yms.

/*
export const atlasConnection = mongoose.createConnection(
  process.env.MONGO_URI!
);*/

//console.log('Yhdistetään osoitteeseen:', process.env.MONGO_AZURE_URI);

// Local — peltolohkot
export const localConnection = mongoose.createConnection(
  //process.env.MONGO_LOCAL_URI!  // mongodb://localhost:27017/ndvi
  process.env.MONGO_AZURE_URI!
);

//atlasConnection.on("connected", () => console.log("Atlas: yhdistetty"));
localConnection.on("connected", () => console.log("Local MongoDB: yhdistetty"));

//atlasConnection.on("error", (err:string) => console.error("Atlas virhe:", err));
localConnection.on("error", (err:string) => console.error("Local virhe:", err));