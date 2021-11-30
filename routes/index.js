import routeCallback from "./callback.js";
import routeResults from "./results.js";
import routeManualRun from "./manual_run.js";
import errorHandler from "../controllers/middlewares/error.js";
import routeSpecificSummary from "./specific_results_summary.js";
import routeSpecificRun from "./specific_results.js";
import routeAllTests from "./all_tests.js";
import routeCompare from "./compare.js";

class Routes {
  setRoutes(app) {
    errorHandler.setRoutes(app);
    routeCallback.setRoutes(app);
    routeAllTests.setRoutes(app);
    routeResults.setRoutes(app);
    routeManualRun.setRoutes(app);
    routeSpecificSummary.setRoutes(app);
    routeSpecificRun.setRoutes(app);
    routeCompare.setRoutes(app);
  }
}

export default new Routes();
