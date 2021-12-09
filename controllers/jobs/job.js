import { getRunStamp } from "../../utils.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function queueJob(queueData, jobQueue) {
  try {
    if (jobQueue) {
      const runStamp = await getRunStamp(queueData.manual);
      await fs.mkdir(path.resolve(__dirname, `../../results/${runStamp}`), {
        recursive: true,
      });
      const url =
        process.env.DEVMODE === "true"
          ? `http://localhost:3200/demotests/results/${runStamp}`
          : `https://dev.api.bte.ncats.io/demotests/results/${runStamp}`;
      let job = await jobQueue.add(queueData, {
        jobId: `demotests:${runStamp}`
      });
      return {
        jobId: runStamp,
        url: url,
      };
    } else {
      return {
        error: "Redis service is unavailable",
      };
    }
  } catch (error) {
    return {
      error: error.message,
      trace: error.trace
    };
  }
};
