import authedusers from "../authedusers.js";
import { getJobQueue } from "../controllers/jobs/job_queue.js";
import { queueJob } from "../controllers/jobs/job.js";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { runDemoQueries } from "../controllers/demo.js";

let jobQueue = getJobQueue("demotests");

if (jobQueue) {
  if (process.env.FORGOT_OLD_JOBS === 'true') {
    jobQueue.removeJobs('*');
  }
  jobQueue.process(runDemoQueries);
}

class RouteManualRun {
  setRoutes(app) {
    app.get("/demotests/manualrun", async (req, res, next) => {
      res.set("Conent-Type", "application/json");
      if (!req.query.runner || !authedusers.includes(req.query.runner)) {
        res
          .status(403)
          .end(
            JSON.stringify({ error: "Run must be ordered by authorized user" })
          );
      }

      jobQueue = getJobQueue("demotests");
      let queueData = { manual: req.query.runner, annotation: req.query.annotation };
      let job = await queueJob(queueData, jobQueue);

      if (job.error) {
        res.end(JSON.stringify(job));
      } else {
        res.end(
          JSON.stringify({
            runName: job.jobId,
            runOrderedBy: req.query.runner,
            annotation: req.query.annotation,
            url: job.url,
          })
        );
      }
    });
  }
}

export default new RouteManualRun();
