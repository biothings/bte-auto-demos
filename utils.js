import { promises as fs } from "fs";
import path from "path";
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
  try {
    const stat = await fs.stat(file);
    return true;
  } catch (error) {
    return false;
  }
}

export async function sleep(ms) {
  return new Promise(async (resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
