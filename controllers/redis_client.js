import { createClient } from "redis";
import redisLock from "redis-lock";
import { promisify } from "util";

let client;

const enableRedis =
  !(process.env.REDIS_HOST === undefined) &&
  !(process.env.REDIS_PORT === undefined);

if (enableRedis === true) {
  client = createClient({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
  });
}

const redisClient =
  enableRedis === true
    ? {
        ...client,
        lock: promisify(redisLock(client)),
      }
    : {};

export default redisClient;
