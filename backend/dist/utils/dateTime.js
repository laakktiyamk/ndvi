"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortByDateTime = exports.addOneDay = exports.zeroDateTime = exports.getFormattedTime = void 0;
/**
 * Formats the elapsed time into minutes and seconds.
 * @param {number} elapsedTime - The elapsed time in milliseconds.
 * @returns {string} A formatted string representing the elapsed time in minutes and seconds (MM:SS).
 */
const getFormattedTime = (elapsedTime) => {
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
exports.getFormattedTime = getFormattedTime;
/**
 * Sets the time of a date object to midnight (00:00:00.000).
 * @param {Date} date - The date object.
 * @returns {string} An ISO string representing the date with time set to midnight.
 */
const zeroDateTime = (date) => {
    date.setUTCHours(0, 0, 0, 0);
    return date.toISOString();
};
exports.zeroDateTime = zeroDateTime;
/**
 * Adds one day to the given date.
 * @param {Date | string} date - The date object or ISO string.
 * @returns {string} An ISO string representing the date after adding one day.
 */
const addOneDay = (date) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    return nextDate.toISOString();
};
exports.addOneDay = addOneDay;
/**
 * Sorts an array of objects by a specified date-time property.
 * @param {any[]} array - The array of objects to sort.
 * @param {string} property - The date-time property by which to sort.
 * @param {'asc' | 'desc'} [sortOrder='asc'] - The sort order ('asc' for ascending, 'desc' for descending).
 * @returns {any[]} The sorted array of objects.
 */
const sortByDateTime = (array, property, sortOrder = 'asc') => {
    // Create a shallow copy before sorting, as .sort() mutates the original array
    return [...array].sort((a, b) => {
        const dateA = new Date(a[property]).getTime();
        const dateB = new Date(b[property]).getTime();
        if (sortOrder.toLowerCase() === 'desc') {
            return dateB - dateA;
        }
        else {
            return dateA - dateB;
        }
    });
};
exports.sortByDateTime = sortByDateTime;
