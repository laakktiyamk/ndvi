import { CropType } from "../mongo/models/CropType";

export const getAllCropTypes = async () => {
  return CropType.find({}, { _id: 0 }).lean();
};