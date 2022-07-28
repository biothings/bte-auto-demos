import authedusers from "../authedusers.js";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { handleResponse } from "../controllers/demo.js";
import { customAlphabet } from "nanoid";
import callbackHandler from "../controllers/callbacks.js";
import axios from "axios";

class RouteTestQuery {
  setRoutes(app) {
    app.post("/demotests/testquery", async (req, res, next) => {
      res.set("Conent-Type", "application/json");
      const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10)
      try {
        const query = req.body;
        const callbackKey = `testQuery_${nanoid()}`;
        query.callback =
          process.env.DEVMODE === "true"
            ? `http://localhost:3200/demotests/cb/${callbackKey}`
            : `https://api.bte.ncats.io/demotests/cb/${callbackKey}`;
        const startTime = new Date();
        const useCaching = process.env.USE_CACHING === 'true' ? 'true' : 'false';
        const queueResponse = await axios({
          method: "post",
          url:
            process.env.DEVMODE === "true"
              ? `http://localhost:3000/v1/asyncquery?caching=${useCaching}`
              : `https://api.bte.ncats.io/v1/asyncquery?caching=${useCaching}`,
          data: query,
          timeout: process.env.SHORT_TIMEOUT || 60 * 1000,
        });
        let timedOut = false;
        let done = false;
        setTimeout(() => {
          if (!done) {
            debug("Request timed out from demotests side.");
            timedOut = true;
            callbackHandler.timeoutCallback(callbackKey);
          }
        }, process.env.JOB_TIMEOUT || 1000 * 60 * 60); // one hour timeout
        const response = await callbackHandler.waitForCallback(
          callbackKey,
          startTime
        );
        done = true;
        const result = await handleResponse(response);
        // result.actualResponse = response.response;
        res.end(JSON.stringify(result));
      } catch (error) {
        res.end(JSON.stringify({
          error: error.message,
          trace: process.env.DEVMODE === 'true'
            ? error.stack
            : undefined
        }));
      }
    });
  }
}

export default new RouteTestQuery();
