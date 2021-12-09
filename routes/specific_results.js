import path from "path";
import { promises as fs } from "fs";
import { sortResultHistory, fileExists, readFile } from "../utils.js";

class RouteResults {
  setRoutes(app) {
    app.get("/demotests/results/:runStamp/:file", async (req, res, next) => {
      res.setHeader("Content-Type", "application/json");
      const folders = await sortResultHistory();
      // ensure no directory shenanigans
      const runStamp = path.basename(req.params.runStamp);
      const file = path.basename(req.params.file);

      const folder = folders.find(
        (folder) => path.basename(folder) === runStamp
      );
      if (!folder) {
        res.status(404).end(
          JSON.stringify({
            error: "Specified run does not exist",
          })
        );
      } else if (!fileExists(path.resolve(folder, file))) {
        res.status(404).end({
          error: "Specified file does not exist within specified run",
        });
      } else {
        res
          .setHeader("Content-Type", "application/json")
          .end(await readFile(path.resolve(folder, file), ));
      }
    });
  }
}

export default new RouteResults();
