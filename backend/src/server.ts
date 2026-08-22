
import app from "./app";
import mongoose from "mongoose";
import dotenv from "dotenv";
//dotenv.config();

const port = parseInt(process.env.PORT as string) || 1234;

// HUOM: mongodb.ts sisältää connectionin myös!!! JOTEN TÄÄÄLLÄ ei tehdä kytkentää

//const MONGO_URI = process.env.MONGO_URI as string;
//console.log(MONGO_URI);
//const MONGO_URI = "mongodb://127.0.0.1:27017/fielsparcelsdb"; 

/*
mongoose.connect(MONGO_URI);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB:", mongoose.connection.name);
});*/

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export {};
