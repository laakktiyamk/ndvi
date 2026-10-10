"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CropType = void 0;
const mongoose_1 = require("mongoose");
const connections_1 = require("../connections");
const CropTypeSchema = new mongoose_1.Schema({
    kasvikoodi: { type: String, unique: true, index: true },
    color: { type: String, default: null },
}, {
    collection: "cropTypes",
});
const CropTypeModel = connections_1.parcelConnection.model("CropType", CropTypeSchema);
exports.CropType = CropTypeModel;
