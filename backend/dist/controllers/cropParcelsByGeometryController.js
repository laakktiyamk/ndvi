"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cropParcelsByGeometry = void 0;
const cropParcelService_1 = require("../services/cropParcelService"); // sovita polku ja tiedostonimi omaan service-tiedostoosi
const cropParcelsByGeometry = async (req, res) => {
    const geometry = req.body?.geometry;
    if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) {
        return res.status(400).json({ error: "Polygon or MultiPolygon geometry required" });
    }
    try {
        const parcels = await (0, cropParcelService_1.getByGeometry)(geometry);
        return res.json(parcels);
    }
    catch (err) {
        console.error("cropParcelsByGeometry failed:", err);
        return res.status(500).json({ error: "crop parcel lookup failed" });
    }
};
exports.cropParcelsByGeometry = cropParcelsByGeometry;
