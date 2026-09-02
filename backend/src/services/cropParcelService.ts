import { CropParcel } from "../mongo/models/CropParcel";

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