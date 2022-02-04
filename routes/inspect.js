import authedusers from "../authedusers.js";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { handleResponse } from "../controllers/demo.js";

class RouteInspect {
  setRoutes(app) {
    app.post("/demotests/inspect", async (req, res, next) => {
      res.set("Conent-Type", "application/json");
      try {
        const result = await handleResponse({
          response: req.body,
          responseTime: null,
        });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.end(JSON.stringify({error: error.message}));
      }
    });
  }
}

export default new RouteInspect();
