"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Checks if a given date falls within the specified growing season.
 * @param {Date | string | number} date - The date to check.
 * @param {GrowingSeasonConfig} growingSeason - Object representing the growing season boundaries.
 * @returns {boolean} True if the date is within the growing season, false otherwise.
 */
const isDateInGrowingSeason = (date, growingSeason) => {
    const d = new Date(date);
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const afterStart = month > growingSeason.startMonth ||
        (month === growingSeason.startMonth && day >= growingSeason.startDay);
    const beforeEnd = month < growingSeason.endMonth ||
        (month === growingSeason.endMonth && day <= growingSeason.endDay);
    return afterStart && beforeEnd;
};
exports.default = isDateInGrowingSeason;
