import path from "path";
import { promises as fs } from "fs";
import { sortResultHistory, fileExists } from "../utils.js";
import async from "async";

class RouteResults {
  setRoutes(app) {
    app.get("/demotests/results", async (req, res, next) => {
      res.setHeader("Content-Type", "application/json");
      const folders = await sortResultHistory();
      const finishedResults = await async.filter(folders, async (run) => {
        return await fileExists(path.resolve(run, "summary.json"));
      });
      if (folders.length === 0) {
        res.end(JSON.stringify({ error: "No demo tests have been run yet!" }));
        return;
      } else if (finishedResults.length === 0) {
        res.end(
          JSON.stringify({
            error:
              "First demo test is not yet complete. Please try again later.",
          })
        );
        return;
      }
      let index = 0;
      // ensure most recent file is complete
      let resultComplete = await fileExists(
        path.resolve(finishedResults[index], "summary.json")
      );
      while (!resultComplete) {
        ++index;
        resultComplete = await fileExists(
          path.resolve(finishedResults[index], "summary.json")
        );
      }
      if (index + 1 > finishedResults.length) {
        res.end(
          JSON.stringify({
            error:
              "First demo test is not yet complete. Please try again later.",
          })
        );
        return;
      }
      res.end(
        await fs.readFile(path.resolve(finishedResults[0], "summary.json"), "utf8")
      );
    });
  }
}

export default new RouteResults();
