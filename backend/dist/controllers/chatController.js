"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = void 0;
const mongodb = __importStar(require("../mongo/mongodb"));
const chatService_1 = require("../services/chatService");
const chat = async (req, res) => {
    const { question, geometryHash, geometry } = req.body;
    if (!question) {
        res.status(400).json({ error: "question and geometryHash required" });
        return;
    }
    const ndviData = await mongodb.getDates(geometryHash);
    const weatherData = await mongodb.getAllWeather(geometryHash);
    //console.log("geometryHash:", geometryHash);
    //console.log("ndviData:", ndviData);
    //console.log("weatherData:", weatherData);
    console.log("ndviData:", JSON.stringify(ndviData, null, 2));
    if (!ndviData && !weatherData.length) {
        res.status(404).json({ error: "no data found" });
        return;
    }
    //const answer = await askNdviQuestion(question, ndviData, weatherData);
    const answer = await (0, chatService_1.askNdviQuestion)(question, ndviData, weatherData, geometry);
    res.status(200).json({ answer });
};
exports.chat = chat;
