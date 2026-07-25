"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = parseInt(process.env.PORT) || 1234;
// HUOM: mongodb.ts sisältää connectionin myös!!! JOTEN TÄÄÄLLÄ ei tehdä kytkentää
const MONGO_URI = process.env.MONGO_URI;
mongoose_1.default.connect(MONGO_URI);
mongoose_1.default.connection.on("connected", () => {
    console.log("Connected to MongoDB:", mongoose_1.default.connection.name);
});
app_1.default.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
