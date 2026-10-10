"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCropTypes = void 0;
const CropType_1 = require("../mongo/models/CropType");
const getAllCropTypes = async () => {
    return CropType_1.CropType.find({}, { _id: 0 }).lean();
};
exports.getAllCropTypes = getAllCropTypes;
