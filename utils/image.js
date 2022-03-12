import fetch from "node-fetch";
import fs from "fs";
import { fileTypeFromBuffer, fileTypeFromFile } from "file-type";

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"];

export const jobs = {};

export const connections = new Map();

export const servers = JSON.parse(fs.readFileSync(new URL("../servers.json", import.meta.url), { encoding: "utf8" })).image;

export async function getType(image, extraReturnTypes) {
  if (!image.startsWith("http")) {
    const imageType = await fileTypeFromFile(image);
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
    const imageBuffer = await imageRequest.arrayBuffer();
    const imageType = await fileTypeFromBuffer(imageBuffer);
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
}
