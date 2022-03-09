import { createRequire } from "module";
import { isMainThread, parentPort, workerData } from "worker_threads";
import fetch from "node-fetch";

const nodeRequire = createRequire(import.meta.url);

const magick = nodeRequire(`../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/image.node`);

const enumMap = {
  "forget": 0,
  "northwest": 1,
  "north": 2,
  "northeast": 3,
  "west": 4,
  "center": 5,
  "east": 6,
  "southwest": 7,
  "south": 8,
  "southeast": 9
};

export default function run(object) {
  return new Promise((resolve, reject) => {
    // If the image has a path, it must also have a type
    let promise = Promise.resolve();
    if (object.path) {
      if (object.params.type !== "image/gif" && object.onlyGIF) resolve({
        buffer: Buffer.alloc(0),
        fileExtension: "nogif"
      });
      promise = fetch(object.path).then(res => res.arrayBuffer()).then(buf => Buffer.from(buf));
    }
    // Convert from a MIME type (e.g. "image/png") to something ImageMagick understands (e.g. "png").
    // Don't set `type` directly on the object we are passed as it will be read afterwards.
    // If no image type is given (say, the command generates its own image), make it a PNG.
    const fileExtension = object.params.type ? object.params.type.split("/")[1] : "png";
    promise.then(buf => {
      object.params.data = buf;
      const objectWithFixedType = Object.assign({}, object.params, { type: fileExtension });
      if (objectWithFixedType.gravity) {
        if (isNaN(objectWithFixedType.gravity)) {
          objectWithFixedType.gravity = enumMap[objectWithFixedType.gravity];
        }
      }
      try {
        const result = magick[object.cmd](objectWithFixedType);
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
      process.exit();
    })
    .catch(err => {
      // turn promise rejection into normal error
      throw err;
    });
}
