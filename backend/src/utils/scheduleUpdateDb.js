/**
 * Module for scheduling and managing cron jobs.
 * @module cronManager
 */

const cron = require("node-cron");

let cronJob = null;

/**
 * Starts a cron job that runs the provided callback function at regular intervals.
 * @param {number} seconds - The interval in seconds at which the callback function should be executed.
 * @param {Function} callBack - The callback function to be executed by the cron job.
 */
const start = async (seconds, callBack) => {
  // Schedule a cron job to run the callback function at the specified interval
  cronJob = cron.schedule(`*/${seconds} * * * * *`, callBack);
};

/**
 * Stops the currently running cron job.
 */
const stop = async () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log("Stopping cron ***************************");
  }
};

module.exports = {
  start,
  stop
};
