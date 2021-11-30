import { runDemoQueries } from "../controllers/demo.js";
import authedusers from "../authedusers.js";

let active = false;

class RouteCallback {
  setRoutes(app) {
    app.get("/demotests/manualrun", async (req, res, next) => {
      res.set("Conent-Type", "application/json");
      if (active) {
        res
          .status(403)
          .end(JSON.stringify({ error: `Previous manual run still in progress (ordered by ${active}).` }));
      }
      if (!req.query.runner || !authedusers.includes(req.query.runner)) {
        res
          .status(403)
          .end(JSON.stringify({ error: "Run must be ordered by authorized user" }));
      } else {
        try {
          active = req.query.runner;
          const result = await runDemoQueries(req.query.runner);
          res.end(JSON.stringify(result));
        } catch (error) {
          next(error);
        } finally {
          active = false;
        }
      }
    });
  }
}

export default new RouteCallback();
