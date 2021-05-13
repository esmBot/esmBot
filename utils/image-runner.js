const magick = require(`../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/image.node`);
const { isMainThread, parentPort, workerData } = require("worker_threads");
const fetch = require("node-fetch");

exports.run = object => {
  return new Promise((resolve, reject) => {
    // If the image has a path, it must also have a type
    let promise = new Promise((resolveTest) => { resolveTest(); }); // no-op
    if (object.path) {
      if (object.type !== "image/gif" && object.onlyGIF) resolve({
        buffer: Buffer.alloc(0),
        fileExtension: "nogif"
      });
      promise = fetch(object.path).then(res => res.buffer());
    }
    // Convert from a MIME type (e.g. "image/png") to something ImageMagick understands (e.g. "png").
    // Don't set `type` directly on the object we are passed as it will be read afterwards.
    // If no image type is given (say, the command generates its own image), make it a PNG.
    const fileExtension = object.type ? object.type.split("/")[1] : "png";
    promise.then(buf => {
      object.data = buf;
      const objectWithFixedType = Object.assign({}, object, {type: fileExtension});
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
};

if (!isMainThread) {
  this.run(workerData)
    .then(returnObject => {
      parentPort.postMessage(returnObject);
      process.exit();
      return;
    })
    .catch(err => {
      // turn promise rejection into normal error
      throw err;
    });
}
