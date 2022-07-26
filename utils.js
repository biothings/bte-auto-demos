import { promises as fs } from "fs";
import path, { resolve } from "path";
import dateFormat, { masks } from "dateformat";
import Debug from "debug";
const debug = Debug("demotests:utils");
import redisClient from "./controllers/redis_client.js";
import async from "async";

import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function findRecursive(dir, options, currentDepth = 1) {
  const foundFiles = [];

  const mindepth = options?.mindepth || 0;
  const maxdepth = options?.maxdepth || Infinity;
  const matching = options?.matching || undefined;

  const files = await fs.readdir(dir);

  if (files.length) {
    await Promise.all(
      files.map(async (file) => {
        file = path.resolve(dir, file);
        const stat = await fs.stat(file);
        if (stat.isDirectory()) {
          if (currentDepth < maxdepth) {
            const files = await findRecursive(file, options, currentDepth + 1);
            if (files.length) {
              foundFiles.push(...files);
            }
          }
        } else if (
          currentDepth >= mindepth &&
          new RegExp(matching).test(path.basename(file))
        ) {
          foundFiles.push(file);
        }
      })
    );
  }
  return foundFiles;
}

export async function sortResultHistory() {
  const folders = await fs.readdir(path.resolve(__dirname, "./results"));
  return folders
    .sort((f1, f2) => {
      const f1Split = f1.split("-");
      const f2Split = f2.split("-");
      const f1Date = new Date(f1Split.slice(1, 4).join("-"));
      const f2Date = new Date(f2Split.slice(1, 4).join("-"));

      if (f1Date > f2Date) {
        return -1;
      } else if (f1Date < f2Date) {
        return 1;
      } else if (f1Split.length > f2Split.length) {
        return -1;
      } else if (f1Split.length < f2Split.length) {
        return 1;
      } else {
        return parseInt(f2Split[4].slice(1)) - parseInt(f1Split[4].slice(1));
      }
    })
    .map((f1) => path.resolve(__dirname, "./results", f1));
}

export async function fileExists(file) {
  return new Promise(async resolve => {
    redisClient.client.usingLock(`demotest:lock:${file}`, 600000, async (signal) => {
      await redisClient.client.delTimeout(file);
      try {
        await fs.stat(file);
        resolve(true);
      } catch (error) {
        resolve(false);
      }
    });
  })
}

export async function sleep(ms) {
  return new Promise(async (resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

export async function getRunStamp(manual = false) {
  const date = dateFormat(new Date(), "yyyy-mm-dd");
  let stamp;
  if (manual) {
    let counter = 0;
    while (
      await fileExists(
        path.resolve(__dirname, `./results/results-${date}-m${counter}`)
      )
    ) {
      counter += 1;
    }
    stamp = `results-${date}-m${counter}`;
  } else {
    stamp = `results-${date}`;
  }
  debug(`runStamp is ${stamp}`);
  return stamp;
}

export async function writeFile(fname, data) {
  return new Promise(async resolve => {
    redisClient.client.usingLock(`demotest:lock:${fname}`, 600000, async (signal) => {
      await redisClient.client.delTimeout(fname);
      try {
        await fs.writeFile(fname, data, "utf8");
      } finally{
        resolve();
      }
    });
  })
}

export async function readFile(fname) {
  return new Promise(async resolve => {
    redisClient.client.usingLock(`demotest:lock:${fname}`, 600000, async (signal) => {
      await redisClient.client.delTimeout(fname);
      let fileData;
      try {
        fileData = await fs.readFile(fname);
      } finally {
        resolve(fileData);
      }
    });
  })
}

export async function getFinishedTests() {
  const folders = await sortResultHistory();
  const finishedResults = await async.filter(folders, async (run) => {
    const runExists = await fileExists(path.resolve(run, "summary.json"));
    if (!runExists) {
      return false;
    }
    const runInProgress = JSON.parse(await readFile(path.resolve(run, "summary.json"))).runInProgress;
    return typeof runInProgress === 'undefined';
  });
  return finishedResults;

}

export function fuzzyCompare(a, b, percent) {
  if (a <= b) {
    return b <= a*(1+percent/100)
  } else {
    return a <= b*(1+percent/100)
  }
}

export async function getOldResults(daysOld) {
  const excludeSummaryRegex = "^(?!.*summary\\.json).*";
  const allResults = await findRecursive(path.resolve(__dirname, './results'), {
    mindepth: 2,
    maxdepth: 2,
    matching: excludeSummaryRegex
  });
  const resultsWithCreationTime = await Promise.all(allResults.map(async result => ({
    resultPath: result,
    modifyTime: (await fs.stat(result)).mtime
  })))
  return resultsWithCreationTime
    .filter(result => (new Date() - result.modifyTime)/1000/60/60/24 >= daysOld)
    .map(result => result.resultPath)
}

export async function deleteFile(file) {
  await fs.unlink(file)
}