import mongoose from "mongoose";
import { User, IUser } from "./models/User";
import { Image } from "./models/Image";
import { Dates, IDates } from "./models/Dates";
import { Workarea } from "./models/Workarea";

import { Weather } from "./models/Weather";
import { IWeather } from '../types';
import { IImage } from '../types';

/*
import imageModel from "./models/image.js";
import datesModel from "./models/dates.js";
import userModel from "./models/user.js";
*/

import dotenv from "dotenv";
dotenv.config();


const mongoURI = process.env.MONGO_URI || "";

// Establish database connection if not already connected
if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(mongoURI)
    .then(() => {
      console.log("DB Connected!");
    })
    .catch((err) => {
      console.error("Error while connecting to db: ", err);
    });
}

/**
 * Registers a new user.
 */
export const register = async (
  firstname: string,
  lastname: string,
  email: string,
  passwordHash: string,
  admin: boolean
): Promise<void> => {
  const user = new User({
    firstname,
    lastname,
    email,
    passwordHash,
    admin,
  });

  await user.save();
};

/**
 * Logs in a user.
 */
export const login = async (email: string): Promise<IUser | null> => {
  return await User.findOne({ email: email });
};

/**
 * Saves dates data.
 */

/**
 * saveDates — lisätty userId $addToSet:lla (ei duplikaatteja)
 */
export const saveDates = async (
  id: string,
  data: any[],
  geometry: any,
  area: number,
  name: string = '',
  userId: string = ''
): Promise<boolean> => {
  try {

    console.log("saveDates called with id:", id, "userId:", userId);
    const update: any = {
      $set: { id, dates: data, geometry, area, name },
    };

    if (userId) {
      update.$addToSet = { userIds: userId };
    }

    await Dates.findOneAndUpdate(
      { id },
      update,
      { upsert: true }
    );

    return true;
  } catch (err: any) {
    console.error("Error saving dates:", err.message);
    return false;
  }
};


/**
 * updateDates — lisätty userId $addToSet:lla
 */

export const updateDates = async (id: string, newItem: any[], userId: string = ''): Promise<boolean> => {
  try {
    await Dates.findOneAndUpdate(
      { id },
      {
        $push: { dates: { $each: newItem, $position: 0 } },
        $addToSet: { userIds: userId },
      },
      { returnDocument: 'after' }
    );
    return true;
  } catch (err) {
    console.log("ERROR", err);
    return false;
  }
};

/**
 * Inserts multiple dates into the database.
 */
export const insertManyDates = async (dataArray: any[]): Promise<boolean> => {
  try {
    const ids = dataArray.map((item) => item.id);
    const existingItems = await Dates.find({ id: { $in: ids } });

    const newDataArray = dataArray.filter(
      (item) => !existingItems.some((existingItem) => existingItem.id === item.id)
    );

    if (newDataArray.length > 0) {
      // mongoose returns inserted array or results object
      await Dates.insertMany(newDataArray);
      return true;
    } else {
      console.log("No new documents to insert");
      return false;
    }
  } catch (err: any) {
    console.error("Error saving dates:", err.message);
    return false;
  }
};


/**
 * Deletes dates data.
 */
export const deleteDates = async (id: string): Promise<boolean> => {
  try {
    await Dates.findOneAndDelete({ id: id });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * Retrieves dates data by ID.
 */
export const getDates = async (id: string): Promise<IDates | null> => {
  return await Dates.findOne({ id: id }, { _id: 0, geometry: 0, __v: 0 });
};

/**
 * Retrieves all date sets.
 */

/*
export const getAllDateSets = async (userId: string): Promise<IDates[]> => {

  console.log("###### getAllDateSets called with userId:", userId);

  return await Dates.find(
    { userIds: userId },              // ← vain käyttäjän omat lohkot
    { _id: 0, __v: 0, geometry: 0 }
  );
};*/

export const getAllDateSets = async (userId: string): Promise<IDates[]> => {

  const result = await Dates.find(
    { userIds: userId },
    { _id: 0, __v: 0, dates: 0 }
  );
  return result;
};


/**
 * Saves user data.
 */
export const saveUser = async (data: string): Promise<boolean | undefined> => {
  try {
    const res = await User.findOne({ companyId: data });

    if (!res) {
      const user = new User({ companyId: data });
      await user.save();
      return true;
    }
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

/**
 * Updates user data.
 */
export const updateUser = async (companyId: string, ...data: any[]): Promise<any> => {
  try {
    const _data = data[0];
    const res = await User.findOneAndUpdate(
      { companyId: companyId },
      _data,
      { returnDocument: 'after' }
    );
    return res; // Fixed JS typo 'ret' -> 'res'
  } catch (err) {
    console.log("ERROR", err);
    return false;
  }
};

/**
 * Retrieves user status.
 */
export const userStatus = async (companyId: string): Promise<IUser | boolean> => {
  try {
    const res = await User.findOne({ companyId: companyId });
    if (res) {
      return res;
    } else {
      return false;
    }
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

/**
 * Saves image data.
 */
export const saveImage = async (data: any): Promise<boolean> => {
  try {
    await Image.findOneAndUpdate(
      { id: data.id },
      data,
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error("ERROR saveImage:", err);
    return false;
  }
};

/**
 * 
 * @param data 
 * @returns 
 */


/**
 * Retrieves image data by ID.
 */
export const getImage = async (id: string): Promise<IImage | null> => {
  try {
    return await Image.findOne(
      { id: id },
      { _id: 0, __v: 0 }
    ).lean<IImage>();
  } catch (e: any) {
    console.error(e.message);
    return null;
  }
};
/**
 * Retrieves all images that match the search string.
 */




export const getAllImages = async (search: string): Promise<IImage[]> => {
  try {
    return await Image.find(
      { id: { $regex: search, $options: "i" } },
      { _id: 0, __v: 0 }
    ).lean<IImage[]>();
  } catch (e: any) {
    console.error(e.message);
    return [];
  }
};

/**
 * Deletes an image by ID.
 */
export const deleteImage = async (id: string): Promise<any> => {
  try {
    return await Image.findOneAndDelete({ id: id });
  } catch (err) {
    console.error("xxxx ", err);
    return false;
  }
};


export const getImagesByIds = async (ids: string[]): Promise<IImage[]> => {
  try {
    return await Image.find(
      { id: { $in: ids } },
      { _id: 0, __v: 0 }
    ).lean<IImage[]>();
  } catch (err) {
    console.error("ERROR getImagesByIds:", err);
    return [];
  }
};

/**
 * Clears all collections in the database.
 */
export const doEmptyDb = async (): Promise<void> => {
  let ret = await Dates.deleteMany({});
  console.log("Dates deleted ", ret);
  ret = await Image.deleteMany({});
  console.log("Image deleted ", ret);
  ret = await User.deleteMany({});
  console.log("User deleted ", ret);
};


export const saveWeather = async (data: IWeather): Promise<boolean> => {
  try {
    await Weather.findOneAndUpdate(
      { sentinelid: data.sentinelid },
      data,
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error("ERROR saveWeather:", err);
    return false;
  }
};

export const getWeather = async (sentinelid: string): Promise<IWeather | null> => {
  try {
    return await Weather.findOne(
      { sentinelid },
      { _id: 0, __v: 0 }
    ).lean<IWeather>();
  } catch (err) {
    console.error("ERROR getWeather:", err);
    return null;
  }
};

export const getAllWeather = async (geometryHash: string): Promise<IWeather[]> => {
  try {
    return await Weather.find(
      { geometryHash },
      { _id: 0, __v: 0 }
    ).sort({ date: 1 }).lean<IWeather[]>();
  } catch (err) {
    console.error("ERROR getAllWeather:", err);
    return [];
  }
};

/**
 * Saves block (workarea) data.
 * (Completed from your truncated code block)
 */
export const saveBlock = async (data: any): Promise<boolean> => {
  try {
    await Workarea.findOneAndUpdate(
      { id: data.id },
      data,
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error("Error while saving block data:", err);
    return false;
  }
};

/**
 * Retrieves all block data.
 * @returns {Array} - The array of block data objects.
 */
export const getBlocks = async () => {
  try {
    return await Workarea.find({});
  } catch (err) {
    console.log("ERROR ", err);
  }
};

/**
 * Retrieves all block data that are not marked as NDVI.
 * @returns {Array} - The array of block data objects.
 */
export const getBlocksNotNDVI = async () => {
  try {
    return await Workarea.find({ ndvi: false });
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

/**
 * Sets the NDVI status of all block data.
 * @param {boolean} status - The NDVI status to set.
 * @returns {boolean} - Whether the operation was successful.
 */
export const setAllBlockNDVIStatus = async (status: boolean) => {
  try {
    await Workarea.updateMany({}, { $set: { ndvi: status } });
    return true;
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

/**
 * Sets the NDVI status of a block by ID.
 * @param {string} id - The block ID.
 * @param {boolean} status - The NDVI status to set.
 * @returns {boolean} - Whether the operation was successful.
 */
export const setBlockNDVIStatus = async (id: string, status: boolean) => {
  try {
    const res = await Workarea.findOne({ id: id });

    if (!res) {
      return false;
    } else {
      await Workarea.updateOne({ id: id }, { $set: { ndvi: status } });
      return true;
    }
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

/**
 * Drops the dates collection.
 * @returns {boolean} - Whether the operation was successful.
 */
export const dropDates = async () => {
  try {
    const ret = await Dates.collection.drop();

    if (ret) {
      return true;
    } else {
      return false;
    }
  } catch (e: any) {
    console.error(e.message);
    return false;
  }
};

/**
 * Drops the images collection.
 * @returns {boolean} - Whether the operation was successful.
 */
export const dropImages = async () => {
  try {
    const ret = await Image.collection.drop();

    if (ret) {
      return true;
    } else {
      return false;
    }
  } catch (e: any) {
    console.error(e.message);
    return false;
  }
};

// seuraavat turhia POISTA
/**
 * Retrieves all data for a specific user.
 * @param {string} user - The user name.
 * @returns {Array} - The array of data objects.
 */
export const getAllData = (user: string) => {
  return Image.find({ name: user }, { date: 1, average: 1, _id: 0 });
};

/**
 * Checks if data exists for a specific user and date.
 * @param {string} user - The user name.
 * @param {string} date - The date.
 * @returns {Object|null} - The data object if found, otherwise null.
 */
export const ifExists = async (user: string, date: string) => {
  return await Image.findOne({ name: user, date: new Date(date) });
};

// dev-jutut omaan tiedostoonsa ja käytössä vain dev-routessa dev-controllers
