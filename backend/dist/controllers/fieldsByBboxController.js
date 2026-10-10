"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldsByBbox = void 0;
const fieldParcelService_1 = require("../services/fieldParcelService");
const fieldsByBbox = async (req, res) => {
    const { minLat, maxLat, minLon, maxLon } = req.query;
    if (!minLat || !maxLat || !minLon || !maxLon) {
        res.status(400).json({ error: "minLat, maxLat, minLon, maxLon vaaditaan" });
        return;
    }
    const minLatNum = parseFloat(minLat);
    const maxLatNum = parseFloat(maxLat);
    const minLonNum = parseFloat(minLon);
    const maxLonNum = parseFloat(maxLon);
    if ([minLatNum, maxLatNum, minLonNum, maxLonNum].some(isNaN)) {
        res.status(400).json({ error: "Parametrien pitää olla numeroita" });
        return;
    }
    const fields = await (0, fieldParcelService_1.getFieldsByBbox)(minLatNum, maxLatNum, minLonNum, maxLonNum);
    res.status(200).json(fields);
};
exports.fieldsByBbox = fieldsByBbox;
