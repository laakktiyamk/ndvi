"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cropParcelsByField = void 0;
const CropParcel_1 = require("../mongo/models/CropParcel");
const cropParcelsByField = async (req, res) => {
    const { peruslohkotunnus } = req.params;
    if (!peruslohkotunnus) {
        res.status(400).json({ error: "peruslohkotunnus vaaditaan" });
        return;
    }
    const cropParcels = await CropParcel_1.CropParcel.find({ peruslohkotunnus }, {
        tunnus: 1,
        lohkonumero: 1,
        kasvikoodi: 1,
        pinta_ala: 1,
        luomuviljely: 1,
        geometry: 1,
        _id: 0,
    }).lean();
    if (!cropParcels.length) {
        res.status(404).json({ error: "Ei kasvulohkoja peruslohkotunnuksella: " + peruslohkotunnus });
        return;
    }
    res.status(200).json(cropParcels);
};
exports.cropParcelsByField = cropParcelsByField;
