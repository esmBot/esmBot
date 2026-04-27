import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { request } from "./media.ts";
import type { MediaLib } from "./mediaLib.ts";
import { mimeToExt } from "./mime.ts";
import type { JobOutput, MediaParams, MediaTypes } from "./types.ts";

let media: MediaLib | undefined;

const defaultExts = {
  image: "png",
};

export default async function run(object: MediaParams): Promise<JobOutput> {
  // dynamically load media library
  if (!media) {
    const imported = await import("./mediaLib.js");
    media = imported.media;
  }

  // Check if command exists
  const supportedTypes: MediaTypes[] = [];
  for (const [type, cmds] of Object.entries(media.funcs)) {
    if (cmds.some((v) => v.name === object.cmd)) {
      supportedTypes.push(type as MediaTypes);
    }
  }

  if (supportedTypes.length === 0) {
    return {
      buffer: Buffer.alloc(0),
      type: "nocmd",
      spoiler: false,
    };
  }

  let inputBuffer: Buffer | undefined;
  let fileType: string | undefined;
  let mediaType: MediaTypes | undefined;
  let spoiler = false;
  try {
    for (const media of object.inputs) {
      const res = await request(new URL(media.path), supportedTypes, false);
      if (res) {
        inputBuffer = res.buf;
        fileType = res.type;
        mediaType = res.mediaType;
        spoiler = media.spoiler;
        break;
      }
    }
    if (!inputBuffer || !mediaType) throw "nomedia";
  } catch (e) {
    if (typeof e !== "string") throw e;
    return {
      buffer: Buffer.alloc(0),
      type: e,
      spoiler: false,
    };
  }

  if (object.spoiler) spoiler = true;

  let validInput = false;
  for (const type of supportedTypes) {
    const func = media.funcs[type].find((v) => v.name === object.cmd);
    if (!func) continue;

    if (func.input) {
      if (type === mediaType) {
        validInput = true;
        break;
      }
    } else {
      validInput = true;
      break;
    }
  }

  // Reject non-animated formats for commands that only work on animations
  if (
    supportedTypes.includes("image") &&
    fileType !== "image/gif" &&
    fileType !== "image/webp" &&
    media.funcs.image.find((v) => v.name === object.cmd)?.anim
  ) {
    return {
      buffer: Buffer.alloc(0),
      type: "noanim",
      spoiler: false,
    };
  }

  if (!validInput) {
    return {
      buffer: Buffer.alloc(0),
      type: "nomedia",
      spoiler: false,
    };
  }

  if (!mediaType) {
    // A function without input will always return a single media type
    mediaType = supportedTypes[0];
  }

  // Convert from a MIME type (e.g. "image/png") to something the media processor understands (e.g. "png").
  // Don't set `type` directly on the object we are passed as it will be read afterwards.
  // If no type is given (say, the command generates its own output), use a default type.
  const fileExtension = fileType ? mimeToExt(fileType) : defaultExts[mediaType];

  const inputObj = {
    data: inputBuffer.buffer.slice(
      inputBuffer.byteOffset,
      inputBuffer.byteOffset + inputBuffer.byteLength,
    ) as ArrayBuffer,
    type: fileExtension,
  };

  object.params.basePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../");
  const { data, type } = await media.process(mediaType, object.cmd, object.params, inputBuffer ? inputObj : {});
  return {
    buffer: data,
    type,
    spoiler,
  };
}
