import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import process from "node:process";
import type { MediaParams, MediaTypes } from "./types.ts";

interface FuncObject {
  name: string;
  input: boolean;
  anim?: boolean;
}

export interface MediaLib {
  funcs: {
    image: FuncObject[];
  };

  process(
    type: MediaTypes,
    cmd: string,
    params: MediaParams["params"],
    input: {
      data?: ArrayBuffer;
      type?: string;
    },
  ): Promise<{ data: Buffer; type: string }>;
  init(): {
    image?: string[];
  };
  trim(): number;
}

const nodeRequire = createRequire(import.meta.url);
const relPath = `../../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/esmbmedia.node`;

export const media = nodeRequire(relPath) as MediaLib;
