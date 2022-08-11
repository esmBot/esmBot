import { request } from "undici";
import fs from "fs";
import { fileTypeFromBuffer, fileTypeFromFile } from "file-type";

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"];

export const jobs = {};

export const connections = new Map();

export const servers = JSON.parse(fs.readFileSync(new URL("../config/servers.json", import.meta.url), { encoding: "utf8" })).image;

export async function getType(image, extraReturnTypes) {
  if (!image.startsWith("http")) {
    const imageType = await fileTypeFromFile(image);
    if (imageType && formats.includes(imageType.mime)) {
      return imageType.mime;
    }
    return undefined;
  }
  let type;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 3000);
  try {
    const imageRequest = await request(image, {
      signal: controller.signal,
      method: "HEAD"
    });
    clearTimeout(timeout);
    const size = imageRequest.headers["content-range"] ? imageRequest.headers["content-range"].split("/")[1] : imageRequest.headers["content-length"];
    if (parseInt(size) > 26214400 && extraReturnTypes) { // 25 MB
      type = "large";
      return type;
    }
    const typeHeader = imageRequest.headers["content-type"];
    if (typeHeader) {
      type = typeHeader;
    } else {
      const timeout = setTimeout(() => {
        controller.abort();
      }, 3000);
      const bufRequest = await request(image, {
        signal: controller.signal,
        headers: {
          range: "bytes=0-1023"
        }
      });
      clearTimeout(timeout);
      const imageBuffer = await bufRequest.body.arrayBuffer();
      const imageType = await fileTypeFromBuffer(imageBuffer);
      if (imageType && formats.includes(imageType.mime)) {
        type = imageType.mime;
      }
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
