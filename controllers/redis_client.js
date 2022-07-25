import Redis from "ioredis";
import Redlock from "redlock";
import Debug from "debug";
const debug = Debug("demotests:redis-client");

const timeoutFunc = (func, timeoutms = 0) => {
  return (...args) => {
    return new Promise(async (resolve, reject) => {
      const timeout = timeoutms ? timeoutms : parseInt(process.env.REDIS_TIMEOUT || 60000);
      let done = false;
      setTimeout(() => {
        if (!done) {
          reject(new Error(`redis call timed out, args: ${JSON.stringify(...args)}`));
        }
      }, timeout);
      const returnValue = await func(...args);
      done = true;
      resolve(returnValue);
    });
  };
};

class RedisClient {
  constructor() {
    this.client;
    this.enableRedis = !(process.env.REDIS_HOST === undefined) && !(process.env.REDIS_PORT === undefined);

    if (!this.enableRedis) {
      this.client = {};
      this.clientEnabled = false;
      return;
    }
    let client;

    const details = {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    };
    if (process.env.REDIS_PASSWORD) {
      details.password = process.env.REDIS_PASSWORD;
    }
    if (process.env.REDIS_TLS_ENABLED) {
      details.tls = { checkServerIdentity: () => undefined };
    }
    client = new Redis(details);

    // allow up to 10 minutes to acquire lock (in case of large items being saved/retrieved)
    const redlock = new Redlock([client], {retryDelay: 500, retryCount: 1200});

    this.client = {
      ...client,
      getTimeout: timeoutFunc((...args) => client.get(...args)),
      setTimeout: timeoutFunc((...args) => client.set(...args)),
      hsetTimeout: timeoutFunc((...args) => client.hset(...args)),
      hgetallTimeout: timeoutFunc((...args) => client.hgetall(...args)),
      expireTimeout: timeoutFunc((...args) => client.expire(...args)),
      delTimeout: timeoutFunc((...args) => client.del(...args)),
      usingLock: (...args) => redlock.using(...args),
      // hmsetTimeout: timeoutFunc((...args) => client.hmset(...args)),
      // keysTimeout: timeoutFunc((...args) => client.keys(...args)),
      existsTimeout: timeoutFunc((...args) => client.exists(...args)),
      pingTimeout: timeoutFunc((...args) => client.ping(...args), 10000), // for testing
    };
    debug('Initialized redis client');
    this.clientEnabled = true;
  }
}

export default new RedisClient();
