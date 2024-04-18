import { createRequire } from "node:module";

const nodeRequire = createRequire(import.meta.url);
const relPath = `../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/image.node`;

export const img = nodeRequire(relPath);
