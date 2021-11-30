import express from "express";
import routes from "./routes/index.js";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import setCron from "./controllers/cronjob.js";
import rateLimit from "express-rate-limit"

fs.mkdirSync(`./results`, { recursive: true });
const app = express();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 1000
});

app.use(bodyParser.json({ limit: "2gb" }));
app.use(bodyParser.urlencoded({ limit: "2gb", extended: true }));
routes.setRoutes(app);
setCron();

const PORT = parseInt(process.env.PORT) || 3200;
app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT}`)
);
