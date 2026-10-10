import { CropParcel } from "../mongo/models/CropParcel";
import intersect from "@turf/intersect";
import area from "@turf/area";
import { feature, featureCollection } from "@turf/helpers";

const MIN_OVERLAP = 0.3;

export const getByGeometry = async (geometry: any) => {
  const parcels: any[] = await CropParcel.find(
    { geometry: { $geoIntersects: { $geometry: geometry } } },
    {
      peruslohkotunnus: 1, // väliaikainen, poistetaan kun suodatus on varmistettu
      tunnus: 1,
      lohkonumero: 1,
      kasvikoodi: 1,
      pinta_ala: 1,
      luomuviljely: 1,
      geometry: 1,
      _id: 0,
    }
  ).lean();

  const aoi = feature(geometry);
  const aoiArea = area(aoi);

  return parcels
    .map((p) => {
      let overlap = 0;
      try {
        const common = intersect(featureCollection([aoi, feature(p.geometry)]));
        if (common) overlap = area(common) / Math.min(aoiArea, area(feature(p.geometry)));
      } catch {
        overlap = 0; // virheellinen geometria → ei oteta mukaan
      }
      return { ...p, overlap: Number(overlap.toFixed(2)) }; // väliaikainen
    })
    .filter((p) => p.overlap >= MIN_OVERLAP);
};

export const getByPeruslohkotunnus = async (peruslohkotunnus: string) => {
  return CropParcel.find(
    { peruslohkotunnus },
    {
      tunnus: 1,
      lohkonumero: 1,
      kasvikoodi: 1,
      pinta_ala: 1,
      luomuviljely: 1,
      geometry: 1,
      _id: 0,
    }
  ).lean();
};
