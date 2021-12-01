import path from "path";
import { promises as fs } from "fs";
import { sortResultHistory, fileExists } from "../utils.js";

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
      if (!folder || !(await fileExists(path.resolve(oldFolder, "summary.json")))) {
        res.status(404).end(
          JSON.stringify({
            error: "Specified run does not exist",
          })
        );
      } else {
        res
          .setHeader("Content-Type", "application/json")
          .end(await fs.readFile(path.resolve(folder, "summary.json"), "utf8"));
      }
    });
  }
}

export default new RouteResults();
