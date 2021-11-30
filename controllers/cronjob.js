import cron from "node-cron";
import { runDemoQueries } from "./demo.js";
import Debug from "debug";
const debug = Debug("demotests:cron");

export default function setCron() {
  cron.schedule("0 1 * * *", () => {
    debug("Beginning automated run of demo queries...");
    runDemoQueries();
  });
  debug("Cron job set.");
}
