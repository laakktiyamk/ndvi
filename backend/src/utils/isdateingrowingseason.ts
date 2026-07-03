/**
 * Represents the structure of the growing season configuration from JSON.
 */
interface GrowingSeasonConfig {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

/**
 * Checks if a given date falls within the specified growing season.
 * @param {Date | string | number} date - The date to check.
 * @param {GrowingSeasonConfig} growingSeason - Object representing the growing season boundaries.
 * @returns {boolean} True if the date is within the growing season, false otherwise.
 */
const isDateInGrowingSeason = (
  date: Date | string | number, 
  growingSeason: GrowingSeasonConfig
): boolean => {
  const parsedDate = new Date(date);
  const month = parsedDate.getUTCMonth() + 1;
  const day = parsedDate.getUTCDate();

  if (month >= growingSeason.startMonth && month <= growingSeason.endMonth) {
    if (
      (month === growingSeason.startMonth && day < growingSeason.startDay) || 
      (month === growingSeason.endMonth && day > growingSeason.endDay)
    ) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
};

export default isDateInGrowingSeason;
