"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldByLocation = void 0;
const fieldParcelService_1 = require("../services/fieldParcelService");
const fieldByLocation = async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        res.status(400).json({ error: "lat ja lon vaaditaan query-parametreina" });
        return;
    }
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (isNaN(latNum) || isNaN(lonNum)) {
        res.status(400).json({ error: "lat ja lon pitää olla numeroita" });
        return;
    }
    const field = await (0, fieldParcelService_1.getFieldByLocation)(latNum, lonNum);
    if (!field) {
        res.status(404).json({ error: "Ei peltolohkoa annetuissa koordinaateissa" });
        return;
    }
    res.status(200).json(field);
};
exports.fieldByLocation = fieldByLocation;
