import cron from "node-cron";
import { getJobQueue } from "./jobs/job_queue.js";
import { queueJob } from "./jobs/job.js";
import path from "path";
import Debug from "debug";
const debug = Debug("demotests:cron");
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { runDemoQueries } from "./demo.js";
import { getOldResults, deleteFile } from "../utils.js"

const jobQueue = getJobQueue("demotests");

if (jobQueue) {
  if (process.env.FORGOT_OLD_JOBS === 'true') {
    jobQueue.removeJobs('*');
  }
  jobQueue.process(runDemoQueries);
}

export default function setCron() {
  cron.schedule("0 1 * * *", () => {
    const job = queueJob({ manual: false }, jobQueue);
    if (job.error) {
      debug(`Automated run encountered error: ${job.error}`);
      if (job.trace) {
        console.log(job.trace);
      }
    }
  });
  cron.schedule("0 2 * * *", async () => {
    debug("Deleting files older than 90 days")
    const oldResults = await getOldResults(90)
    oldResults.forEach(async file => {
      debug(file)
      try {
        await deleteFile(file)
        debug(`Deleted old file: ${file}`)
      } catch (error) {
        debug(`Unable to delete ${file}`)
      }
    })
    debug("Completed deleting old files.");
  })
  debug("Cron jobs set.");
}
