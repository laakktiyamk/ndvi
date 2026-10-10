"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureLocalConnected = exports.parcelConnection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = process.env.MONGO_AZURE_URI;
if (!uri)
    throw new Error("MONGO_AZURE_URI puuttuu");
// Local/Azure — peltolohkot, kasvulohkot, ML_data
exports.parcelConnection = mongoose_1.default.createConnection(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000,
});
exports.parcelConnection.on("connected", () => console.log("Parcel DB: connected"));
exports.parcelConnection.on("error", (err) => console.error("Parcel DB error:", err));
const ensureLocalConnected = () => exports.parcelConnection.asPromise();
exports.ensureLocalConnected = ensureLocalConnected;
