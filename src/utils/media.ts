import { Buffer } from "node:buffer";
import { lookup } from "node:dns/promises";
import fs from "node:fs";
import process from "node:process";
import { fileTypeFromStream } from "file-type";
import ipaddr from "ipaddr.js";
import logger from "./logger.ts";
import MediaConnection from "./mediaConnection.ts";
import { random } from "./misc.ts";
import type { MediaParams, MediaTypeData } from "./types.ts";

const run = process.env.API_TYPE === "ws" ? null : (await import("./mediaRunner.ts")).default;
let mediaLib: import("./mediaLib.ts").MediaLib | undefined;

interface ServerConfig {
  name: string;
  server: string;
  auth?: string;
  tls?: boolean;
}

export const formats = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
};
export const connections = new Map<string, MediaConnection>();
export let servers: ServerConfig[];

export async function initMediaLib() {
  const { media } = await import("./mediaLib.ts");
  media.init();
  mediaLib = media;
}

export async function getType(
  media: URL,
  extraReturnTypes: boolean,
  typeMedia: MediaParams["type"][],
): Promise<MediaTypeData | undefined> {
  try {
    const remoteIP = await lookup(media.host);
    const parsedIP = ipaddr.parse(remoteIP.address);
    if (parsedIP.range() !== "unicast") return;
  } catch (e) {
    const err = e as Error;
    if ("code" in err && err.code === "ENOTFOUND") return;
    throw e;
  }
  let type: string | undefined;
  let mediaType: MediaParams["type"] | undefined;
  let url: string;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 3000);
  try {
    const mediaRequest = await fetch(media, {
      signal: controller.signal,
      method: "HEAD",
    });
    clearTimeout(timeout);
    if (mediaRequest.redirected) {
      const redirectHost = new URL(mediaRequest.url).host;
      const remoteIP = await lookup(redirectHost);
      const parsedIP = ipaddr.parse(remoteIP.address);
      if (parsedIP.range() !== "unicast") return;
    }
    url = mediaRequest.url;
    let size = 0;
    if (mediaRequest.headers.has("content-range")) {
      const contentRange = mediaRequest.headers.get("content-range");
      if (contentRange) size = Number.parseInt(contentRange.split("/")[1]);
    } else if (mediaRequest.headers.has("content-length")) {
      const contentLength = mediaRequest.headers.get("content-length");
      if (contentLength) size = Number.parseInt(contentLength);
    }
    if (size > 41943040 && extraReturnTypes) {
      // 40 MB
      type = "large";
      return { type };
    }
    const typeHeader = mediaRequest.headers.get("content-type");
    if (typeHeader) {
      type = typeHeader;
      const typePrefix = typeHeader.split("/")[0];
      if (typePrefix !== "image") return;
      mediaType = typePrefix;
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
      if (bufRequest.body) {
        const fileType = await fileTypeFromStream(bufRequest.body);
        if (fileType) {
          if (
            ![...(typeMedia.length === 0 ? formats.image : typeMedia.flatMap((v) => formats[v]))].includes(
              fileType.mime,
            )
          )
            return;

          const typePrefix = fileType.mime.split("/")[0] as MediaParams["type"];
          if (!typeMedia.includes(typePrefix)) return;
          mediaType = typePrefix;

          if (mediaType) type = fileType.mime;
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
  return { type, url, mediaType };
}

function connect(server: string, auth: string | undefined, name: string | undefined, tls?: boolean) {
  const connection = new MediaConnection(server, auth, name, tls);
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
  const parsed = JSON.parse(data);
  if (parsed.image) {
    logger.warn('!!! THE "image" FIELD IN config/servers.json IS DEPRECATED !!!');
    logger.warn(
      'The "image" field has been renamed to "media". Please rename it in your config; esmBot will no longer read this field in a future version.',
    );
    servers = parsed.image;
  } else {
    servers = parsed.media;
  }
}

export async function reloadMediaConnections() {
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

async function getIdeal(object: MediaParams): Promise<MediaConnection | undefined> {
  const idealServers = [];
  for (const connection of connections.values()) {
    if (connection.conn.readyState !== 1) {
      continue;
    }
    if (!connection.funcs[object.type]?.includes(object.cmd)) {
      idealServers.push(null);
      continue;
    }
    if (object.input?.type && !connection.formats[object.type]?.[object.cmd]?.includes(object.input.type)) continue;
    idealServers.push(connection);
  }
  if (idealServers.length === 0) throw "No available servers";
  return random(idealServers.filter((v) => !!v));
}

let running = 0;

export async function runMediaJob(params: MediaParams): Promise<{ buffer: Buffer; type: string }> {
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
    // Called from command (not using media API)
    running++;
    const data = await run(params).finally(() => {
      running--;
      if (running < 0) running = 0;
      if (mediaLib && running === 0) {
        mediaLib.trim();
      }
    });
    return {
      buffer: Buffer.from([...data.buffer]),
      type: data.fileExtension,
    };
  }
  throw "media_not_working";
}
