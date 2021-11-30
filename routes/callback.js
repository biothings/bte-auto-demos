import callbackHandler from "../controllers/callbacks.js";

class RouteCallback {
  setRoutes(app) {
    app.post("/demotests/cb/:key", async (req, res, next) => {
      callbackHandler.receiveCallback(req.params.key, req.body);
      res.status(200).end();
    });
  }
}

export default new RouteCallback();
