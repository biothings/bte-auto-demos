import path from "path";
import { promises as fs } from "fs";
import { sortResultHistory, fileExists, readFile } from "../utils.js";
import { getJobQueue } from "../controllers/jobs/job_queue.js";

class RouteResults {
  setRoutes(app) {
    app.get("/demotests/results/:runStamp", async (req, res, next) => {
      res.setHeader("Content-Type", "application/json");
      const folders = await sortResultHistory();
      // ensure no directory shenanigans
      const runStamp = path.basename(req.params.runStamp);

      const folder = folders.find(
        (folder) => path.basename(folder) === runStamp
      );
      if (!folder) {
        res.status(404).end(
          JSON.stringify({
            error: "Specified run does not exist",
          })
        );
      } else if (!(await fileExists(path.resolve(folder, "summary.json")))) {
        const jobQueue = getJobQueue('demotests');
        res.status(404).end(
          JSON.stringify({
            error: "Specified run not complete",
            status: await (await jobQueue.getJob(`demotests:${runStamp}`)).getState()
          })
        );
      }else {
        res
          .setHeader("Content-Type", "application/json")
          .end(await readFile(path.resolve(folder, "summary.json")));
      }
    });
  }
}

export default new RouteResults();
