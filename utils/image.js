const magick = require("../build/Release/image.node");
const fetch = require("node-fetch");
const { promisify } = require("util");
const AbortController = require("abort-controller");
const fileType = require("file-type");
const execPromise = promisify(require("child_process").exec);

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif"];

exports.run = async (object, fromAPI = false) => {
  if (process.env.API === "true" && !fromAPI) {
    const req = await fetch(`${process.env.API_URL}/run`, {
      method: "POST",
      body: JSON.stringify(object),
      headers: {
        "Content-Type": "application/json"
      }
    });
    const buffer = await req.buffer();
    console.log(buffer.toString());
    if (buffer.toString() === "nogif") return {
      buffer: "nogif",
      type: null
    };
    return {
      buffer: buffer,
      type: req.headers.get("content-type").split("/")[1]
    };
  } else {
    let type;
    if (!fromAPI && object.path) {
      type = (object.type ? object.type : await this.getType(object.path)).split("/")[1];
      if (type !== "gif" && object.onlyGIF) return {
        buffer: "nogif",
        type: null
      };
      object.type = type;
      const delay = (await execPromise(`ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate ${object.path}`)).stdout.replace("\n", "");
      object.delay = (100 / delay.split("/")[0]) * delay.split("/")[1];
    }
    const data = await promisify(magick[object.cmd])(object);
    return fromAPI ? data : {
      buffer: data,
      type: type
    };
  }
};

exports.check = (cmd) => {
  return magick[cmd] ? true : false;
};

exports.getType = async (image) => {
  let type;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 25000);
  try {
    const imageRequest = await fetch(image, { signal: controller.signal, highWaterMark: 512 });
    const imageBuffer = await imageRequest.buffer();
    const imageType = await fileType.fromBuffer(imageBuffer);
    if (imageType && formats.includes(imageType.mime)) {
      type = imageType.mime;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw Error("Timed out");
    } else {
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
  return type;
};