const magick = require("../build/Release/image.node");
const { promisify } = require("util");
const execPromise = promisify(require("child_process").exec);
const { isMainThread, parentPort, workerData } = require("worker_threads");

exports.run = async (object, fromAPI = false) => {
  return new Promise(async resolve => {
    // If the image has a path, it must also have a type
    if (object.path) {
      if (object.type !== "image/gif" && object.onlyGIF) resolve({
        buffer: "nogif",
        type: null
      });
      const delay = (await execPromise(`ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate ${object.path}`)).stdout.replace("\n", "");
      object.delay = (100 / delay.split("/")[0]) * delay.split("/")[1];
    }
    // Convert from a MIME type (e.g. "image/png") to something ImageMagick understands (e.g. "png")
    // Don't set `type` directly on the object we are passed as it will be read afterwards
    const objectWithFixedType = Object.assign({}, object, {type: object.type.split("/")[1]});
    const data = await promisify(magick[object.cmd])(objectWithFixedType);
    const returnObject = fromAPI ? data : {
      buffer: data,
      type: object.type
    };
    resolve(returnObject);
  });
};

if (!isMainThread) {
  this.run(workerData)
    // eslint-disable-next-line promise/always-return
    .then(returnObject => {
      parentPort.postMessage(returnObject);
      process.exit();
    })
    .catch(err => {
      // turn promise rejection into normal error
      throw err;
    });
}
