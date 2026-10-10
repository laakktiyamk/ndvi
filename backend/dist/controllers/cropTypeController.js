"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCropTypes = void 0;
const cropTypeService_1 = require("../services/cropTypeService");
const getCropTypes = async (req, res) => {
    const cropTypes = await (0, cropTypeService_1.getAllCropTypes)();
    res.json(cropTypes);
};
exports.getCropTypes = getCropTypes;
