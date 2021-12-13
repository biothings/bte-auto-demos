import { promisify } from "util";
import { default as gitPullOrCloneNonPromise } from "git-pull-or-clone";
import axios from "axios";
import { promises as fs } from "fs";
import {
  findRecursive,
  sleep,
  getRunStamp,
  fileExists,
  writeFile,
  readFile,
} from "../utils.js";

import path from "path";
import callbackHandler from "./callbacks.js";
import async from "async";
import Debug from "debug";
const debug = Debug("demotests:demoRunner");
import { fileURLToPath } from "url";
import redisClient from "./redis_client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const gitPullOrClone = promisify(gitPullOrCloneNonPromise);

async function updateDemoQueries() {
  debug("Checking for updates to demo queries...");
  await gitPullOrClone(
    "https://github.com/NCATSTranslator/minihackathons.git",
    path.resolve(__dirname, "../minihackathons"),
    { depth: Infinity }
  );
  debug("finished updating demo queries.");
}

async function getDemoQueries() {
  const demoQueriesPath = path.resolve(
    __dirname,
    "../minihackathons/2021-12_demo"
  );
  debug(`Reading demo queries from path (${demoQueriesPath})...`);
  const demoQueries = await findRecursive(demoQueriesPath, {
    mindepth: 2,
    maxdepth: 2,
    matching: ".json",
  });
  debug(`Got (${demoQueries.length}) demo queries.`);
  return demoQueries;
}

async function makeInitialRequest(runStamp, queryFile, query, responses) {
  let queueResponse;
  try {
    debug(`Querying ${path.basename(queryFile)}...`);
    queueResponse = await axios({
      method: "post",
      url:
        process.env.DEVMODE === "true"
          ? "http://localhost:3000/v1/asyncquery?caching=false"
          : "https://dev.api.bte.ncats.io/v1/asyncquery?caching=false",
      data: query,
      timeout: process.env.SHORT_TIMEOUT || 60 * 1000,
    });
    debug(`Query made with status (${queueResponse.status})`);
    return queueResponse;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      responses[path.basename(queryFile)] = {
        status: "Initial request timed out",
        error: "Initial request timed out",
      };
    } else {
      responses[path.basename(queryFile)] = {
        status: "Initial request failed",
        error: error.message,
      };
    }
    await writeFile(
      path.resolve(
        __dirname,
        `../results/${runStamp}/${path.basename(queryFile)}`
      ),
      JSON.stringify(responses[path.basename(queryFile)])
    );
    return undefined;
  }
}

async function writeSummary(runStamp, manual, responses, inProgress = false) {
  const resultSummary = {
    runName: runStamp,
    runOrderedBy: manual ? manual : "automation",
    runInProgress: inProgress ? true : undefined,
    runCompleted: inProgress ? undefined : true,
    summary: responses,
  };
  await writeFile(
    path.resolve(__dirname, `../results/${runStamp}/summary.json`),
    JSON.stringify(resultSummary)
  );
}

async function waitForResponseHandle(
  runStamp,
  queryFile,
  callbackKey,
  startTime,
  queueResponse,
  responses
) {
  let timedOut = false;
  let done = false;
  setTimeout(() => {
    if (!done) {
      debug("Request timed out from demotests side.");
      timedOut = true;
      callbackHandler.timeoutCallback(callbackKey);
    }
  }, process.env.JOB_TIMEOUT || 1000 * 60 * 60); // one hour timeout
  try {
    const response = await callbackHandler.waitForCallback(
      callbackKey,
      startTime
    );
    done = true;
    debug(`Got query results after (${response.responseTime})s`);
    debug("Getting final status...");
    await sleep(10 * 1000); // wait so bte can update checkStatus
    let closingInfo = await axios({
      method: "get",
      url: queueResponse.data.url,
      timeout: process.env.SHORT_TIMEOUT || 60 * 1000,
    });
    let remainingAttempts = 10;
    while (closingInfo.data.state !== "completed" && remainingAttempts > 0) {
      remainingAttempts -= 1;
      sleep(1000);
      closingInfo = await axios({
        method: "get",
        url: queueResponse.data.url,
        timeout: process.env.SHORT_TIMEOUT || 60 * 1000,
      });
    }
    debug("Status received. Assembling summary...");

    const responseString = JSON.stringify(response.response);
    responses[path.basename(queryFile)] = {
      job: queueResponse.data.url,
      status: timedOut
        ? `Timed out (demotests side, serverside status: ${closingInfo.data.state})`
        : closingInfo.data.state === "completed" && closingInfo.data.returnvalue
        ? closingInfo.data.returnvalue.status
        : `Checkstatus did not return complete. State at last check: (${closingInfo.data.state})`,
      responseTime: response.responseTime,
      responseKB: Buffer.byteLength(responseString, "utf8") / 1000,
      responseMB: Buffer.byteLength(responseString, "utf8") / 1000 / 1000,
      response: response.response.error
        ? {
            error: response.message,
            link:
              process.env.DEVMODE === "true"
                ? `http://localhost:3200/demotests/results/${runStamp}/${path.basename(
                    queryFile
                  )}`
                : `https://dev.api.bte.ncats.io/demotests/results/${runStamp}/${path.basename(
                    queryFile
                  )}`,
          }
        : {
            nodes: Object.keys(response.response.message.knowledge_graph.nodes)
              .length,
            edges: Object.keys(response.response.message.knowledge_graph.edges)
              .length,
            results: response.response.message.results.length,
            link:
              process.env.DEVMODE === "true"
                ? `http://localhost:3200/demotests/results/${runStamp}/${path.basename(
                    queryFile
                  )}`
                : `https://dev.api.bte.ncats.io/demotests/results/${runStamp}/${path.basename(
                    queryFile
                  )}`,
          },
    };
    const saveLocation = path.resolve(
      __dirname,
      `../results/${runStamp}/${path.basename(queryFile)}`
    );
    debug(`Saving results to ${saveLocation}`);
    await writeFile(saveLocation, responseString);
    debug(`Results saved.`);
  } catch (error) {
    responses[path.basename(queryFile)] = {
      status: "error",
      error: error.message,
      trace: error.stack,
    };
    done = true;
  }
}

async function runDemoQueries(job) {
  const manual = job.data.manual;
  const runStamp = job.id.split(":")[1];

  if (manual) {
    debug(`Test ${runStamp} ordered by ${manual}:\n-----`);
  } else {
    debug("Begin automated test:\n-----");
  }
  await updateDemoQueries();

  debug("Creating runStamp...");
  const demoQueries = await getDemoQueries();
  demoQueries.sort();
  const responses = {};

  await fs.mkdir(path.resolve(__dirname, `../results/${runStamp}`), {
    recursive: true,
  });

  if (
    await fileExists(
      path.resolve(__dirname, `../results/${runStamp}/summary.json`)
    )
  ) {
    const summaryFile = JSON.parse(
      await readFile(
        path.resolve(__dirname, `../results/${runStamp}/summary.json`)
      )
    );
    Object.entries(summaryFile.summary).forEach(([key, val]) => {
      responses[key] = val;
    });
  }
  await async.eachSeries(demoQueries, async (queryFile) => {
    if (responses.hasOwnProperty(path.basename(queryFile))) {
      return; // already done
    }
    const query = JSON.parse(await readFile(queryFile));
    const callbackKey = `${runStamp}-${path.basename(queryFile)}`;
    query.callback =
      process.env.DEVMODE === "true"
        ? `http://localhost:3200/demotests/cb/${callbackKey}`
        : `https://dev.api.bte.ncats.io/demotests/cb/${callbackKey}`;
    const startTime = new Date();

    const queueResponse = await makeInitialRequest(
      runStamp,
      queryFile,
      query,
      responses
    );
    if (typeof queueResponse === "undefined") {
      return;
    }

    await waitForResponseHandle(
      runStamp,
      queryFile,
      callbackKey,
      startTime,
      queueResponse,
      responses
    );
    // update parial summary
    await writeSummary(runStamp, manual, responses, true);
  });

  await writeSummary(runStamp, manual, responses);

  debug(`Summary saved.`);
  debug(`Job completed.`);
}

export default runDemoQueries;
