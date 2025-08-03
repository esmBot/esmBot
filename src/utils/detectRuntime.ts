import process from "node:process";

function canLoadTS(): boolean {
  if (!process.versions.amaro) return false;

  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major > 23 || (major === 23 && minor >= 6) || (major === 22 && minor >= 18)) {
    if (process.argv.includes("--no-experimental-strip-types")) return false;

    if (process.env.NODE_ARGS && process.env.NODE_ARGS !== "") {
      const splitArgs = process.env.NODE_ARGS.split(" ");
      if (splitArgs.includes("--no-experimental-strip-types")) return false;
    }

    return true;
  }

  if (process.argv.includes("--experimental-strip-types")) return true;

  if (process.env.NODE_ARGS && process.env.NODE_ARGS !== "") {
    const splitArgs = process.env.NODE_ARGS.split(" ");
    if (splitArgs.includes("--experimental-strip-types")) return true;
  }

  return false;
}

export default function detectRuntime() {
  if (process.versions.bun) {
    return {
      type: "bun",
      version: process.versions.bun,
      tsLoad: true,
    };
  }
  if (process.versions.deno) {
    return {
      type: "deno",
      version: process.versions.deno,
      tsLoad: true,
    };
  }
  if (process.versions.node) {
    return {
      type: "node",
      version: process.versions.node,
      tsLoad: canLoadTS(),
    };
  }
  return {
    type: "unknown",
    version: null,
    tsLoad: false,
  };
}
