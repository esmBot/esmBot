const fetch = require("node-fetch");
const fs = require("fs");
const fileType = require("file-type");

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/mov"];

exports.jobs = {};

exports.connections = new Map();

exports.servers = JSON.parse(fs.readFileSync("./servers.json", { encoding: "utf8" })).image;

exports.getType = async (image, extraReturnTypes) => {
  if (!image.startsWith("http")) {
    const imageType = await fileType.fromFile(image);
    if (imageType && formats.includes(imageType.mime)) {
      return imageType.mime;
    }
    return undefined;
  }
  let type;
  const controller = new AbortController(); // eslint-disable-line no-undef
  const timeout = setTimeout(() => {
    controller.abort();
  }, 25000);
  try {
    const imageRequest = await fetch(image, {
      signal: controller.signal, headers: {
        "Range": "bytes=0-1023"
      }
    });
    clearTimeout(timeout);
    const size = imageRequest.headers.has("Content-Range") ? imageRequest.headers.get("Content-Range").split("/")[1] : imageRequest.headers.get("Content-Length");
    if (parseInt(size) > 26214400 && extraReturnTypes) { // 25 MB
      type = "large";
      return type;
    }
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
