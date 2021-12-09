import Queue from "bull";
import redisClient from "../redis_client.js";
import { fileExists, readFile, writeFile } from "../../utils.js";
import path from "path";
import { fileURLToPath } from "url";
import { write } from "fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    }).on('failed', async (job, error) => {
      const runSummaryFile = path.resolve(__dirname, `../../results/${job.id.split(":")[1]}/summary.json`);
      if (await fileExists(runSummaryFile)) {
        const summary = JSON.parse(await readFile(runSummaryFile));
        summary.runInProgress = undefined;
        summary.runCompleted = undefined;
        summary.error = 'Run Failed';
        summary.failDetails = {
          message: error.message,
          trace: error.stack
        }
        await writeFile(runSummaryFile, JSON.stringify(summary));
      } else {
        await writeFile(runSummaryFile, JSON.stringify({
          error: error.message,
          trace: error.stack
        }));
      }
    });
  }
  return jobQueue;
};
