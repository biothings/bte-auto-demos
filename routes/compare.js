import path from "path";
import { promises as fs } from "fs";
import { sortResultHistory, fileExists, readFile, getFinishedTests } from "../utils.js";
import compare from "../controllers/compare.js";
import async from "async";

class RouteResults {
  setRoutes(app) {
    app.get("/demotests/compare", async (req, res, next) => {
      res.setHeader("Content-Type", "application/json");
      const folders = await sortResultHistory();
      const finishedResults = await getFinishedTests();
      if (folders.length === 0) {
        res.end(JSON.stringify({ error: "No demo tests have been run yet!" }));
        return;
      } else if (finishedResults.length < 1) {
        res.end(
          JSON.stringify({
            error:
              "First demo test is not yet complete. Please try again later.",
          })
        );
        return;
      } else if (finishedResults.length < 2) {
        res.end(
          JSON.stringify({ error: "Only one demo test has been completed." })
        );
        return;
      }
      // ensure no directory shenanigans
      let older = req.query.old;
      let newer = req.query.new;
      older = older ? path.basename(older) : older;
      newer = newer ? path.basename(newer) : newer;

      if (!older !== !newer) {
        res.status(400).end(
          JSON.stringify({
            error:
              "Must specify both older and newer, or none for latest two runs.",
          })
        );
      } else if (!older) {
        res.end(
          JSON.stringify(
            await compare(
              JSON.parse(
                await readFile(path.resolve(finishedResults[0], "summary.json"))
              ),
              JSON.parse(
                await readFile(path.resolve(finishedResults[1], "summary.json"))
              )
            )
          )
        );
      } else {
        const oldFolder = folders.find(
          (folder) => path.basename(folder) === older
        );
        if (
          !oldFolder ||
          !(await fileExists(path.resolve(oldFolder, "summary.json")))
        ) {
          res.status(404).end(
            JSON.stringify({
              error: "Specified 'old' run does not exist or not complete",
            })
          );
          return;
        }
        const newFolder = folders.find(
          (folder) => path.basename(folder) === newer
        );
        if (
          !newFolder ||
          !(await fileExists(path.resolve(oldFolder, "summary.json")))
        ) {
          res.status(404).end(
            JSON.stringify({
              error: "Specified 'new' run does not exist or not complete",
            })
          );
          return;
        }
        res.end(
          JSON.stringify(
            await compare(
              JSON.parse(
                await readFile(path.resolve(newFolder, "summary.json"))
              ),
              JSON.parse(
                await readFile(path.resolve(oldFolder, "summary.json"))
              )
            )
          )
        );
      }
    });
  }
}

export default new RouteResults();
