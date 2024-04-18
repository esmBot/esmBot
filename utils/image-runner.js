import { isMainThread, parentPort, workerData } from "node:worker_threads";
import * as http from "node:http";
import * as https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { img } from "./imageLib.js";

const enumMap = {
  forget: 0,
  northwest: 1,
  north: 2,
  northeast: 3,
  west: 4,
  center: 5,
  east: 6,
  southwest: 7,
  south: 8,
  southeast: 9
};

export default function run(object) {
  return new Promise((resolve, reject) => {
    // Check if command exists
    if (!img.funcs.includes(object.cmd)) return resolve({
      buffer: Buffer.alloc(0),
      fileExtension: "nocmd"
    });
    // If the image has a path, it must also have a type
    let promise = Promise.resolve();
    if (object.path) {
      if (object.params.type !== "image/gif" && object.onlyGIF) return resolve({
        buffer: Buffer.alloc(0),
        fileExtension: "nogif"
      });
      promise = new Promise((res, rej) => {
        const req = (object.path.startsWith("https") ? https.request : http.request)(object.path);
        req.once("response", (resp) => {
          if (resp.statusCode === 429) {
            req.end();
            return resolve({
              buffer: Buffer.alloc(0),
              fileExtension: "ratelimit"
            });
          }
          const buffers = [];
          resp.on("data", (chunk) => {
            buffers.push(chunk);
          });
          resp.once("end", () => {
            res(Buffer.concat(buffers));
          });
          resp.once("error", rej);
        });
        req.once("error", rej);
        req.end();
      });
    }
    // Convert from a MIME type (e.g. "image/png") to something the image processor understands (e.g. "png").
    // Don't set `type` directly on the object we are passed as it will be read afterwards.
    // If no image type is given (say, the command generates its own image), make it a PNG.
    const fileExtension = object.params.type ? object.params.type.split("/")[1] : "png";
    promise.then(buf => {
      if (buf) object.params.data = buf;
      const objectWithFixedType = Object.assign({}, object.params, { type: fileExtension });
      if (objectWithFixedType.gravity && Number.isNaN(Number.parseInt(objectWithFixedType.gravity))) {
          objectWithFixedType.gravity = enumMap[objectWithFixedType.gravity];
      }
      objectWithFixedType.basePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../");
      try {
        const result = img.image(object.cmd, objectWithFixedType);
        const returnObject = {
          buffer: result.data,
          fileExtension: result.type
        };
        resolve(returnObject);
      } catch (e) {
        reject(e);
      }
    });
  });
}

if (!isMainThread) {
  run(workerData)
    .then(returnObject => {
      parentPort.postMessage(returnObject);
    })
    .catch(err => {
      // turn promise rejection into normal error
      throw err;
    });
} else {
  img.imageInit();
}
