import cron from "node-cron";
import { getJobQueue } from "./jobs/job_queue.js";
import { queueJob } from "./jobs/job.js";
import path from "path";
import Debug from "debug";
const debug = Debug("demotests:cron");
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import runDemoQueries from "./demo.js";

const jobQueue = getJobQueue("demotests");

if (jobQueue) {
  if (process.env.FORGOT_OLD_JOBS === 'true') {
    jobQueue.removeJobs('*');
  }
  jobQueue.process(runDemoQueries);
}

export default function setCron() {
  cron.schedule("0 1 * * *", () => {
    debug("Beginning automated run of demo queries...");
    const job = queueJob({ manual: false }, jobQueue);
    if (job.error) {
      debug(`Automated run encountered error: ${job.error}`);
      if (job.trace) {
        console.log(job.trace);
      }
    }
  });
  debug("Cron job set.");
}
