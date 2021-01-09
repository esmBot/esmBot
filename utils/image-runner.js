const magick = require("../build/Release/image.node");
const { promisify } = require("util");
const { getType } = require("./image");
const execPromise = promisify(require("child_process").exec);
const { isMainThread, parentPort, workerData } = require("worker_threads");

exports.run = async (object, fromAPI = false) => {
  return new Promise(async resolve => {
    let type;
    if (!fromAPI && object.path) {
      const newType = (object.type ? object.type : await getType(object.path));
      type = newType ? newType.split("/")[1] : "png";
      if (type !== "gif" && object.onlyGIF) resolve({
        buffer: "nogif",
        type: null
      });
      object.type = type;
      const delay = (await execPromise(`ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate ${object.path}`)).stdout.replace("\n", "");
      object.delay = (100 / delay.split("/")[0]) * delay.split("/")[1];
    }
    const data = await promisify(magick[object.cmd])(object);
    const returnObject = fromAPI ? data : {
      buffer: data,
      type: type
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
