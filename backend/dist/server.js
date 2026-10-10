"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
//dotenv.config();
const port = parseInt(process.env.PORT) || 1234;
// HUOM: mongodb.ts sisältää connectionin myös!!! JOTEN TÄÄÄLLÄ ei tehdä kytkentää
//const MONGO_URI = process.env.MONGO_URI as string;
//console.log(MONGO_URI);
//const MONGO_URI = "mongodb://127.0.0.1:27017/fielsparcelsdb"; 
/*
mongoose.connect(MONGO_URI);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB:", mongoose.connection.name);
});*/
app_1.default.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
