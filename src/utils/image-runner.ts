import path from "node:path";
import { fileURLToPath } from "node:url";
import { img } from "./imageLib.js";
import type { ImageParams } from "./types.js";

export default function run(object: ImageParams): Promise<{ buffer: Buffer, fileExtension: string }> {
  return new Promise((resolve, reject) => {
    // Check if command exists
    if (!img.funcs.includes(object.cmd)) return resolve({
      buffer: Buffer.alloc(0),
      fileExtension: "nocmd"
    });
    // If the image has a path, it must also have a type
    let promise: Promise<"exit" | ArrayBuffer | null> = Promise.resolve(null);
    if (object.path) {
      if ((object.input.type !== "image/gif" && object.input.type !== "image/webp") && object.onlyAnim) return resolve({
        buffer: Buffer.alloc(0),
        fileExtension: "noanim"
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);
      promise = fetch(object.path, {
        signal: controller.signal
      }).then(res => {
        clearTimeout(timeout);
        if (res.status === 429) throw "ratelimit";
        return res.arrayBuffer();
      }).catch(e => {
        if (typeof e !== "string") reject(e);
        resolve({
          buffer: Buffer.alloc(0),
          fileExtension: e
        });
        return "exit";
      });
    }
    // Convert from a MIME type (e.g. "image/png") to something the image processor understands (e.g. "png").
    // Don't set `type` directly on the object we are passed as it will be read afterwards.
    // If no image type is given (say, the command generates its own image), make it a PNG.
    const fileExtension = object.input.type?.split("/")[1] ?? "png";
    promise.then(buf => {
      if (buf === "exit") return;
      if (buf) object.input.data = buf;
      object.input.type = fileExtension;
      object.params.basePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../");
      img.image(object.cmd, object.params, object.input, (err: Error, data: Buffer, type: string) => {
        if (err) {
          reject(err);
          return;
        }

        const returnObject = {
          buffer: data,
          fileExtension: type
        };
        resolve(returnObject);
      });
    });
  });
}
