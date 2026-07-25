"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifExists = exports.getAllData = exports.dropImages = exports.dropDates = exports.setBlockNDVIStatus = exports.setAllBlockNDVIStatus = exports.getBlocksNotNDVI = exports.getBlocks = exports.saveBlock = exports.getAllWeather = exports.getWeather = exports.saveWeather = exports.doEmptyDb = exports.getImagesByIds = exports.deleteImage = exports.getAllImages = exports.getImage = exports.saveImage = exports.userStatus = exports.updateUser = exports.saveUser = exports.getAllDateSets = exports.getDates = exports.deleteDates = exports.insertManyDates = exports.updateDates = exports.saveDates = exports.login = exports.register = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("./models/User");
const Image_1 = require("./models/Image");
const Dates_1 = require("./models/Dates");
const Workarea_1 = require("./models/Workarea");
const Weather_1 = require("./models/Weather");
/*
import imageModel from "./models/image.js";
import datesModel from "./models/dates.js";
import userModel from "./models/user.js";
*/
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoURI = process.env.MONGO_URI || "";
// Establish database connection if not already connected
if (mongoose_1.default.connection.readyState === 0) {
    mongoose_1.default
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
const register = async (firstname, lastname, email, passwordHash, admin) => {
    const user = new User_1.User({
        firstname,
        lastname,
        email,
        passwordHash,
        admin,
    });
    await user.save();
};
exports.register = register;
/**
 * Logs in a user.
 */
const login = async (email) => {
    return await User_1.User.findOne({ email: email });
};
exports.login = login;
/**
 * Saves dates data.
 */
/**
 * saveDates — lisätty userId $addToSet:lla (ei duplikaatteja)
 */
const saveDates = async (id, data, geometry, area, name = '', userId = '') => {
    try {
        console.log("saveDates called with id:", id, "userId:", userId);
        const update = {
            $set: { id, dates: data, geometry, area, name },
        };
        if (userId) {
            update.$addToSet = { userIds: userId };
        }
        await Dates_1.Dates.findOneAndUpdate({ id }, update, { upsert: true });
        return true;
    }
    catch (err) {
        console.error("Error saving dates:", err.message);
        return false;
    }
};
exports.saveDates = saveDates;
/**
 * updateDates — lisätty userId $addToSet:lla
 */
const updateDates = async (id, newItem, userId = '') => {
    try {
        await Dates_1.Dates.findOneAndUpdate({ id }, {
            $push: { dates: { $each: newItem, $position: 0 } },
            $addToSet: { userIds: userId },
        }, { returnDocument: 'after' });
        return true;
    }
    catch (err) {
        console.log("ERROR", err);
        return false;
    }
};
exports.updateDates = updateDates;
/**
 * Inserts multiple dates into the database.
 */
const insertManyDates = async (dataArray) => {
    try {
        const ids = dataArray.map((item) => item.id);
        const existingItems = await Dates_1.Dates.find({ id: { $in: ids } });
        const newDataArray = dataArray.filter((item) => !existingItems.some((existingItem) => existingItem.id === item.id));
        if (newDataArray.length > 0) {
            // mongoose returns inserted array or results object
            await Dates_1.Dates.insertMany(newDataArray);
            return true;
        }
        else {
            console.log("No new documents to insert");
            return false;
        }
    }
    catch (err) {
        console.error("Error saving dates:", err.message);
        return false;
    }
};
exports.insertManyDates = insertManyDates;
/**
 * Deletes dates data.
 */
const deleteDates = async (id) => {
    try {
        await Dates_1.Dates.findOneAndDelete({ id: id });
        return true;
    }
    catch (err) {
        console.error(err);
        return false;
    }
};
exports.deleteDates = deleteDates;
/**
 * Retrieves dates data by ID.
 */
const getDates = async (id) => {
    return await Dates_1.Dates.findOne({ id: id }, { _id: 0, geometry: 0, __v: 0 });
};
exports.getDates = getDates;
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
const getAllDateSets = async (userId) => {
    const result = await Dates_1.Dates.find({ userIds: userId }, { _id: 0, __v: 0, dates: 0 });
    return result;
};
exports.getAllDateSets = getAllDateSets;
/**
 * Saves user data.
 */
const saveUser = async (data) => {
    try {
        const res = await User_1.User.findOne({ companyId: data });
        if (!res) {
            const user = new User_1.User({ companyId: data });
            await user.save();
            return true;
        }
    }
    catch (err) {
        console.log("ERROR ", err);
        return false;
    }
};
exports.saveUser = saveUser;
/**
 * Updates user data.
 */
const updateUser = async (companyId, ...data) => {
    try {
        const _data = data[0];
        const res = await User_1.User.findOneAndUpdate({ companyId: companyId }, _data, { returnDocument: 'after' });
        return res; // Fixed JS typo 'ret' -> 'res'
    }
    catch (err) {
        console.log("ERROR", err);
        return false;
    }
};
exports.updateUser = updateUser;
/**
 * Retrieves user status.
 */
const userStatus = async (companyId) => {
    try {
        const res = await User_1.User.findOne({ companyId: companyId });
        if (res) {
            return res;
        }
        else {
            return false;
        }
    }
    catch (err) {
        console.log("ERROR ", err);
        return false;
    }
};
exports.userStatus = userStatus;
/**
 * Saves image data.
 */
const saveImage = async (data) => {
    try {
        await Image_1.Image.findOneAndUpdate({ id: data.id }, data, { upsert: true });
        return true;
    }
    catch (err) {
        console.error("ERROR saveImage:", err);
        return false;
    }
};
exports.saveImage = saveImage;
/**
 *
 * @param data
 * @returns
 */
/**
 * Retrieves image data by ID.
 */
const getImage = async (id) => {
    try {
        return await Image_1.Image.findOne({ id: id }, { _id: 0, __v: 0 }).lean();
    }
    catch (e) {
        console.error(e.message);
        return null;
    }
};
exports.getImage = getImage;
/**
 * Retrieves all images that match the search string.
 */
const getAllImages = async (search) => {
    try {
        return await Image_1.Image.find({ id: { $regex: search, $options: "i" } }, { _id: 0, __v: 0 }).lean();
    }
    catch (e) {
        console.error(e.message);
        return [];
    }
};
exports.getAllImages = getAllImages;
/**
 * Deletes an image by ID.
 */
const deleteImage = async (id) => {
    try {
        return await Image_1.Image.findOneAndDelete({ id: id });
    }
    catch (err) {
        console.error("xxxx ", err);
        return false;
    }
};
exports.deleteImage = deleteImage;
const getImagesByIds = async (ids) => {
    try {
        return await Image_1.Image.find({ id: { $in: ids } }, { _id: 0, __v: 0 }).lean();
    }
    catch (err) {
        console.error("ERROR getImagesByIds:", err);
        return [];
    }
};
exports.getImagesByIds = getImagesByIds;
/**
 * Clears all collections in the database.
 */
const doEmptyDb = async () => {
    let ret = await Dates_1.Dates.deleteMany({});
    console.log("Dates deleted ", ret);
    ret = await Image_1.Image.deleteMany({});
    console.log("Image deleted ", ret);
    ret = await User_1.User.deleteMany({});
    console.log("User deleted ", ret);
};
exports.doEmptyDb = doEmptyDb;
const saveWeather = async (data) => {
    try {
        await Weather_1.Weather.findOneAndUpdate({ sentinelid: data.sentinelid }, data, { upsert: true });
        return true;
    }
    catch (err) {
        console.error("ERROR saveWeather:", err);
        return false;
    }
};
exports.saveWeather = saveWeather;
const getWeather = async (sentinelid) => {
    try {
        return await Weather_1.Weather.findOne({ sentinelid }, { _id: 0, __v: 0 }).lean();
    }
    catch (err) {
        console.error("ERROR getWeather:", err);
        return null;
    }
};
exports.getWeather = getWeather;
const getAllWeather = async (geometryHash) => {
    try {
        return await Weather_1.Weather.find({ geometryHash }, { _id: 0, __v: 0 }).sort({ date: 1 }).lean();
    }
    catch (err) {
        console.error("ERROR getAllWeather:", err);
        return [];
    }
};
exports.getAllWeather = getAllWeather;
/**
 * Saves block (workarea) data.
 * (Completed from your truncated code block)
 */
const saveBlock = async (data) => {
    try {
        await Workarea_1.Workarea.findOneAndUpdate({ id: data.id }, data, { upsert: true });
        return true;
    }
    catch (err) {
        console.error("Error while saving block data:", err);
        return false;
    }
};
exports.saveBlock = saveBlock;
/**
 * Retrieves all block data.
 * @returns {Array} - The array of block data objects.
 */
const getBlocks = async () => {
    try {
        return await Workarea_1.Workarea.find({});
    }
    catch (err) {
        console.log("ERROR ", err);
    }
};
exports.getBlocks = getBlocks;
/**
 * Retrieves all block data that are not marked as NDVI.
 * @returns {Array} - The array of block data objects.
 */
const getBlocksNotNDVI = async () => {
    try {
        return await Workarea_1.Workarea.find({ ndvi: false });
    }
    catch (err) {
        console.log("ERROR ", err);
        return false;
    }
};
exports.getBlocksNotNDVI = getBlocksNotNDVI;
/**
 * Sets the NDVI status of all block data.
 * @param {boolean} status - The NDVI status to set.
 * @returns {boolean} - Whether the operation was successful.
 */
const setAllBlockNDVIStatus = async (status) => {
    try {
        await Workarea_1.Workarea.updateMany({}, { $set: { ndvi: status } });
        return true;
    }
    catch (err) {
        console.log("ERROR ", err);
        return false;
    }
};
exports.setAllBlockNDVIStatus = setAllBlockNDVIStatus;
/**
 * Sets the NDVI status of a block by ID.
 * @param {string} id - The block ID.
 * @param {boolean} status - The NDVI status to set.
 * @returns {boolean} - Whether the operation was successful.
 */
const setBlockNDVIStatus = async (id, status) => {
    try {
        const res = await Workarea_1.Workarea.findOne({ id: id });
        if (!res) {
            return false;
        }
        else {
            await Workarea_1.Workarea.updateOne({ id: id }, { $set: { ndvi: status } });
            return true;
        }
    }
    catch (err) {
        console.log("ERROR ", err);
        return false;
    }
};
exports.setBlockNDVIStatus = setBlockNDVIStatus;
/**
 * Drops the dates collection.
 * @returns {boolean} - Whether the operation was successful.
 */
const dropDates = async () => {
    try {
        const ret = await Dates_1.Dates.collection.drop();
        if (ret) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (e) {
        console.error(e.message);
        return false;
    }
};
exports.dropDates = dropDates;
/**
 * Drops the images collection.
 * @returns {boolean} - Whether the operation was successful.
 */
const dropImages = async () => {
    try {
        const ret = await Image_1.Image.collection.drop();
        if (ret) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (e) {
        console.error(e.message);
        return false;
    }
};
exports.dropImages = dropImages;
// seuraavat turhia POISTA
/**
 * Retrieves all data for a specific user.
 * @param {string} user - The user name.
 * @returns {Array} - The array of data objects.
 */
const getAllData = (user) => {
    return Image_1.Image.find({ name: user }, { date: 1, average: 1, _id: 0 });
};
exports.getAllData = getAllData;
/**
 * Checks if data exists for a specific user and date.
 * @param {string} user - The user name.
 * @param {string} date - The date.
 * @returns {Object|null} - The data object if found, otherwise null.
 */
const ifExists = async (user, date) => {
    return await Image_1.Image.findOne({ name: user, date: new Date(date) });
};
exports.ifExists = ifExists;
// dev-jutut omaan tiedostoonsa ja käytössä vain dev-routessa dev-controllers
