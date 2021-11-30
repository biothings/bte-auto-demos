class ErrorHandler {
  setRoutes(app) {
    app.use(async (error, req, res, next) => {
      console.trace(error);
      res.status(500).end({
        error: error.message,
        stackTrace: error.stack,
      });
    });
  }
}

export default new ErrorHandler();
