import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { img } from "./imageLib.ts";
import type { ImageParams } from "./types.ts";

export default async function run(object: ImageParams): Promise<{ buffer: Buffer; fileExtension: string }> {
  // Check if command exists
  if (!img.funcs.includes(object.cmd)) {
    return {
      buffer: Buffer.alloc(0),
      fileExtension: "nocmd",
    };
  }

  let inputBuffer: ArrayBuffer | null = null;
  if (object.path) {
    // If the image has a path, it must also have a type
    if (object.input?.type !== "image/gif" && object.input?.type !== "image/webp" && object.onlyAnim) {
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

  // Convert from a MIME type (e.g. "image/png") to something the image processor understands (e.g. "png").
  // Don't set `type` directly on the object we are passed as it will be read afterwards.
  // If no image type is given (say, the command generates its own image), make it a PNG.
  const fileExtension = object.input?.type?.split("/")[1] ?? "png";

  if (object.input) {
    if (inputBuffer) object.input.data = inputBuffer;
    object.input.type = fileExtension;
  }
  object.params.basePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../");
  const { data, type } = await img.image(object.cmd, object.params, object.input ?? {});
  return {
    buffer: data,
    fileExtension: type,
  };
}
