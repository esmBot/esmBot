import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import process from "node:process";
import type { ImageParams } from "./types.ts";

export interface ImageLib {
  funcs: string[];

  image(
    cmd: string,
    params: ImageParams["params"],
    input: ImageParams["input"],
  ): Promise<{ data: Buffer; type: string }>;
  imageInit(): Record<string, boolean>;
  trim(): number;
}

const nodeRequire = createRequire(import.meta.url);
const relPath = `../../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/image.node`;

export const img = nodeRequire(relPath) as ImageLib;
