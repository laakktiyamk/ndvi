/**
 * Formats the elapsed time into minutes and seconds.
 * @param {number} elapsedTime - The elapsed time in milliseconds.
 * @returns {string} A formatted string representing the elapsed time in minutes and seconds (MM:SS).
 */
export const getFormattedTime = (elapsedTime: number): string => {
  const minutes: number = Math.floor(elapsedTime / 60000);
  const seconds: number = Math.floor((elapsedTime % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Sets the time of a date object to midnight (00:00:00.000).
 * @param {Date} date - The date object.
 * @returns {string} An ISO string representing the date with time set to midnight.
 */
export const zeroDateTime = (date: Date): string => {
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};

/**
 * Adds one day to the given date.
 * @param {Date | string} date - The date object or ISO string.
 * @returns {string} An ISO string representing the date after adding one day.
 */
export const addOneDay = (date: Date | string): string => {
  const nextDate: Date = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate.toISOString();
};
/**
 * Sorts an array of objects by a specified date-time property.
 * @param {any[]} array - The array of objects to sort.
 * @param {string} property - The date-time property by which to sort.
 * @param {'asc' | 'desc'} [sortOrder='asc'] - The sort order ('asc' for ascending, 'desc' for descending).
 * @returns {any[]} The sorted array of objects.
 */
export const sortByDateTime = (
  array: any[], 
  property: string, 
  sortOrder: 'asc' | 'desc' = 'asc'
): any[] => {
  // Create a shallow copy before sorting, as .sort() mutates the original array
  return [...array].sort((a, b) => {
    const dateA: number = new Date(a[property]).getTime();
    const dateB: number = new Date(b[property]).getTime();

    if (sortOrder.toLowerCase() === 'desc') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });
};

