"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGrowingSeason = void 0;
const growingSeason_json_1 = __importDefault(require("../settings/growingSeason.json"));
const getGrowingSeason = async (req, res) => {
    res.status(200).json(growingSeason_json_1.default);
};
exports.getGrowingSeason = getGrowingSeason;
