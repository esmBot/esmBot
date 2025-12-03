import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import process from "node:process";
import type { MediaParams } from "./types.ts";

export interface MediaLib {
  funcs: {
    image: string[];
  };

  process(
    type: MediaParams["type"],
    cmd: string,
    params: MediaParams["params"],
    input: MediaParams["input"],
  ): Promise<{ data: Buffer; type: string }>;
  init(): {
    image?: string[];
  };
  trim(): number;
}

const nodeRequire = createRequire(import.meta.url);
const relPath = `../../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/esmbmedia.node`;

export const media = nodeRequire(relPath) as MediaLib;
