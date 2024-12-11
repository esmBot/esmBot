import { isMainThread, parentPort, workerData } from "node:worker_threads";
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

export default function run(object): Promise<{ buffer: Buffer, fileExtension: string }> {
  return new Promise((resolve, reject) => {
    // Check if command exists
    if (!img.funcs.includes(object.cmd)) return resolve({
      buffer: Buffer.alloc(0),
      fileExtension: "nocmd"
    });
    // If the image has a path, it must also have a type
    let promise: Promise<string | ArrayBuffer> = Promise.resolve(null);
    if (object.path) {
      if (object.params.type !== "image/gif" && object.onlyGIF) return resolve({
        buffer: Buffer.alloc(0),
        fileExtension: "nogif"
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);
      promise = fetch(object.path, {
        signal: controller.signal
      }).then(res => {
        clearTimeout(timeout);
        if (res.status === 429) throw "ratelimit";
        return res.arrayBuffer();
      }).catch(e => {
        if (typeof e !== "string") reject(e);
        resolve({
          buffer: Buffer.alloc(0),
          fileExtension: e
        });
        return "exit";
      });
    }
    // Convert from a MIME type (e.g. "image/png") to something the image processor understands (e.g. "png").
    // Don't set `type` directly on the object we are passed as it will be read afterwards.
    // If no image type is given (say, the command generates its own image), make it a PNG.
    const fileExtension = object.params.type ? object.params.type.split("/")[1] : "png";
    promise.then(buf => {
      if (buf) object.params.data = buf;
      if (buf === "exit") return;
      const objectWithFixedType = Object.assign({}, object.params, { type: fileExtension });
      if (objectWithFixedType.gravity && Number.isNaN(Number.parseInt(objectWithFixedType.gravity))) {
        objectWithFixedType.gravity = enumMap[objectWithFixedType.gravity];
      }
      objectWithFixedType.basePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../");
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
      parentPort.postMessage(returnObject, [returnObject.buffer.buffer]);
    })
    .catch(err => {
      // turn promise rejection into normal error
      throw err;
    });
} else {
  img.imageInit();
}
