import Queue from "bull";
import redisClient from "../redis_client.js";

export function getJobQueue(name) {
  let jobQueue = null;
  if (Object.keys(redisClient).length !== 0) {
    let details = {
      port: process.env.REDIS_PORT,
      host: process.env.REDIS_HOST,
    };
    jobQueue = new Queue(
      name,
      process.env.REDIS_HOST ? { redis: details } : "redis://127.0.0.1:6379",
      {
        defaultJobOptions: {
          timeout: process.env.JOB_TIMEOUT || 6 * 60 * 60 * 1000, // 6 hours
          removeOnFail: false,
        },
        settings: {
          maxStalledCount: 1,
          lockDuration: 6 * 60 * 60 * 1000, // 6 hours
          lochRenewTime: 15000,
        },
      }
    ).on("error", function (error) {
      console.log("err", error);
    });
  }
  return jobQueue;
};
