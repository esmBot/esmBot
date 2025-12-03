import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { media } from "./mediaLib.ts";
import { mimeToExt } from "./mime.ts";
import type { MediaParams } from "./types.ts";

const defaultExts = {
  image: "png",
};

export default async function run(object: MediaParams): Promise<{ buffer: Buffer; fileExtension: string }> {
  // Check if command exists
  if (!media.funcs[object.type]?.includes(object.cmd)) {
    return {
      buffer: Buffer.alloc(0),
      fileExtension: "nocmd",
    };
  }

  let inputBuffer: ArrayBuffer | null = null;
  if (object.path) {
    // If the file has a path, it must also have a type
    if (
      object.type === "image" &&
      object.input?.type !== "image/gif" &&
      object.input?.type !== "image/webp" &&
      object.onlyAnim
    ) {
      return {
        buffer: Buffer.alloc(0),
        fileExtension: "noanim",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const res = await fetch(object.path, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.status === 429) throw "ratelimit";
      inputBuffer = await res.arrayBuffer();
    } catch (e) {
      if (typeof e !== "string") throw e;
      return {
        buffer: Buffer.alloc(0),
        fileExtension: e,
      };
    }
  }

  // Convert from a MIME type (e.g. "image/png") to something the media processor understands (e.g. "png").
  // Don't set `type` directly on the object we are passed as it will be read afterwards.
  // If no type is given (say, the command generates its own output), make it a PNG.
  const fileExtension = object.input?.type ? mimeToExt(object.input.type) : defaultExts[object.type];

  if (object.input) {
    if (inputBuffer) object.input.data = inputBuffer;
    object.input.type = fileExtension;
  }
  object.params.basePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../");
  const { data, type } = await media.process(object.type, object.cmd, object.params, object.input ?? {});
  return {
    buffer: data,
    fileExtension: type,
  };
}
