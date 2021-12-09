import path from "path";
import { promises as fs } from "fs";
import { sortResultHistory, fileExists, getFinishedTests } from "../utils.js";
import async from "async";

class RouteResults {
  setRoutes(app) {
    app.get("/demotests", async (req, res, next) => {
      res.setHeader("Content-Type", "application/json");
      const folders = await sortResultHistory();
      if (folders.length === 0) {
        res.end(JSON.stringify({ error: "No demo tests have been run yet!" }));
        return;
      }
      const finishedResults = await getFinishedTests();
      const resultMap = Object.fromEntries(
        await async.map(finishedResults, async (run) => {
          return [
            path.basename(run),
            process.env.DEVMODE === "true"
              ? `http://localhost:3200/demotests/results/${path.basename(run)}`
              : `https://dev.api.bte.ncats.io/demotests/results/${path.basename(run)}`,
          ];
        })
      );
      if (Object.keys(resultMap).length < 1) {
        res.end(
          JSON.stringify({
            error:
              "First demo tests is not yet complete. Please try again later.",
          })
        );
        return;
      } else {
        res.end(JSON.stringify(resultMap));
      }
    });
  }
}

export default new RouteResults();
