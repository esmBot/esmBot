import { Buffer } from "node:buffer";
import { lookup } from "node:dns/promises";
import fs from "node:fs";
import { createRequire } from "node:module";
import process from "node:process";
import { fileTypeFromBuffer } from "file-type";
import ipaddr from "ipaddr.js";
import serversConfig from "#config/servers.json" with { type: "json" };
import ImageConnection from "./imageConnection.ts";
import logger from "./logger.ts";
import { random } from "./misc.ts";
import type { ImageParams, ImageTypeData } from "./types.ts";

const run = process.env.API_TYPE === "ws" ? null : (await import("../utils/image-runner.ts")).default;
let img: import("./imageLib.ts").ImageLib | undefined;

interface ServerConfig {
  name: string;
  server: string;
  auth?: string;
  tls?: boolean;
}

const formats = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/avif",
];
export const connections = new Map<string, ImageConnection>();
export let servers: ServerConfig[] = process.env.API_TYPE === "ws" ? serversConfig.image : [];

export function initImageLib() {
  const nodeRequire = createRequire(import.meta.url);
  const imgLib = nodeRequire(
    `../../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/image.node`,
  );
  imgLib.imageInit();
  img = imgLib;
}

export async function getType(image: URL, extraReturnTypes: boolean): Promise<ImageTypeData | undefined> {
  try {
    const remoteIP = await lookup(image.host);
    const parsedIP = ipaddr.parse(remoteIP.address);
    if (parsedIP.range() !== "unicast") return;
  } catch (e) {
    const err = e as Error;
    if ("code" in err && err.code === "ENOTFOUND") return;
    throw e;
  }
  let type: string | undefined;
  let url: string;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 3000);
  try {
    const imageRequest = await fetch(image, {
      signal: controller.signal,
      method: "HEAD",
    });
    clearTimeout(timeout);
    if (imageRequest.redirected) {
      const redirectHost = new URL(imageRequest.url).host;
      const remoteIP = await lookup(redirectHost);
      const parsedIP = ipaddr.parse(remoteIP.address);
      if (parsedIP.range() !== "unicast") return;
    }
    url = imageRequest.url;
    let size = 0;
    if (imageRequest.headers.has("content-range")) {
      const contentRange = imageRequest.headers.get("content-range");
      if (contentRange) size = Number.parseInt(contentRange.split("/")[1]);
    } else if (imageRequest.headers.has("content-length")) {
      const contentLength = imageRequest.headers.get("content-length");
      if (contentLength) size = Number.parseInt(contentLength);
    }
    if (size > 41943040 && extraReturnTypes) {
      // 40 MB
      type = "large";
      return { type };
    }
    const typeHeader = imageRequest.headers.get("content-type");
    if (typeHeader) {
      type = typeHeader;
    } else {
      const timeout = setTimeout(() => {
        controller.abort();
      }, 3000);
      const bufRequest = await fetch(url, {
        signal: controller.signal,
        headers: {
          range: "bytes=0-1023",
        },
      });
      clearTimeout(timeout);
      const imageBuffer = await bufRequest.arrayBuffer();
      const imageType = await fileTypeFromBuffer(imageBuffer);
      if (imageType && formats.includes(imageType.mime)) {
        type = imageType.mime;
      }
    }
  } finally {
    clearTimeout(timeout);
  }
  return { type, url };
}

function connect(server: string, auth: string | undefined, name: string | undefined, tls?: boolean) {
  const connection = new ImageConnection(server, auth, name, tls);
  connections.set(server, connection);
}

export function disconnect() {
  for (const connection of connections.values()) {
    connection.close();
  }
  connections.clear();
}

async function repopulate() {
  const data = await fs.promises.readFile(new URL("../../config/servers.json", import.meta.url), { encoding: "utf8" });
  servers = JSON.parse(data).image;
}

export async function reloadImageConnections() {
  disconnect();
  await repopulate();
  let amount = 0;
  for (const server of servers) {
    try {
      connect(server.server, server.auth, server.name, server.tls);
      amount += 1;
    } catch (e) {
      logger.error(e);
    }
  }
  return amount;
}

async function getIdeal(object: ImageParams): Promise<ImageConnection | undefined> {
  const idealServers = [];
  for (const connection of connections.values()) {
    if (connection.conn.readyState !== 0 && connection.conn.readyState !== 1) {
      continue;
    }
    if (!connection.funcs.includes(object.cmd)) {
      idealServers.push(null);
      continue;
    }
    if (object.input?.type && !connection.formats[object.cmd]?.includes(object.input.type)) continue;
    idealServers.push(connection);
  }
  if (idealServers.length === 0) throw "No available servers";
  return random(idealServers.filter((v) => !!v));
}

let running = 0;

export async function runImageJob(params: ImageParams): Promise<{ buffer: Buffer; type: string }> {
  if (process.env.API_TYPE === "ws") {
    const currentServer = await getIdeal(params);
    if (!currentServer)
      return {
        buffer: Buffer.alloc(0),
        type: "nocmd",
      };
    try {
      await currentServer.queue(BigInt(params.id), params);
      const result = await currentServer.wait(BigInt(params.id));
      if (result.sent)
        return {
          buffer: result.data,
          type: "sent",
        };
      const output = await currentServer.getOutput(params.id);
      return output;
    } catch (e) {
      if (e !== "Request ended prematurely due to a closed connection") {
        if (e === "No available servers") throw "Request ended prematurely due to a closed connection";
        throw e;
      }
    }
    return {
      buffer: Buffer.alloc(0),
      type: "noresult",
    };
  }
  if (run) {
    // Called from command (not using image API)
    running++;
    const data = await run(params).finally(() => {
      running--;
      if (running < 0) running = 0;
      if (img && running === 0) {
        img.trim();
      }
    });
    return {
      buffer: Buffer.from([...data.buffer]),
      type: data.fileExtension,
    };
  }
  throw "image_not_working";
}
