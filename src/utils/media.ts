import { Buffer } from "node:buffer";
import { lookup } from "node:dns/promises";
import fs from "node:fs";
import process from "node:process";
import { fileTypeStream, type AnyWebReadableByteStreamWithFileType } from "file-type";
import ipaddr from "ipaddr.js";
import logger from "./logger.ts";
import MediaConnection from "./mediaConnection.ts";
import run from "./mediaRunner.ts";
import { random } from "./misc.ts";
import type { MediaParams, MediaTypes } from "./types.ts";

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
export let servers: ServerConfig[] = [];

export async function initMediaLib() {
  const { media } = await import("./mediaLib.ts");
  media.init();
  mediaLib = media;
}

export async function request(
  media: URL,
  typeMedia: MediaTypes[],
  typeOnly: true,
): Promise<
  | {
      url: string;
      type: string;
      mediaType: MediaTypes;
      ext: string;
    }
  | undefined
>;
export async function request(
  media: URL,
  typeMedia: MediaTypes[],
  typeOnly: false,
): Promise<
  | {
      buf: Buffer;
      url: string;
      type: string;
      mediaType: MediaTypes;
      ext: string;
    }
  | undefined
>;
export async function request(
  media: URL,
  typeMedia: MediaTypes[],
  typeOnly = false,
): Promise<
  | {
      buf?: Buffer;
      url: string;
      type: string;
      mediaType: MediaTypes;
      ext: string;
    }
  | undefined
> {
  // verify that IP address is valid
  try {
    const remoteIP = await lookup(media.host);
    const parsedIP = ipaddr.parse(remoteIP.address);
    if (parsedIP.range() !== "unicast") return;
  } catch (e) {
    const err = e as Error;
    if ("code" in err && err.code === "ENOTFOUND") return;
    throw e;
  }

  let url: string;
  let stream: AnyWebReadableByteStreamWithFileType;

  let size = 0;

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);
  try {
    const res = await fetch(media, {
      signal: controller.signal,
      headers: {
        "User-Agent": `Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com) esmBot/${process.env.ESMBOT_VER}`,
      },
    });
    clearTimeout(timeout);
    url = res.url;
    if (res.status === 429) throw "ratelimit";

    if (res.redirected) {
      const redirectHost = new URL(res.url).host;
      const remoteIP = await lookup(redirectHost);
      const parsedIP = ipaddr.parse(remoteIP.address);
      if (parsedIP.range() !== "unicast") return;
    }

    if (res.headers.has("content-range")) {
      const contentRange = res.headers.get("content-range");
      if (contentRange) size = Number.parseInt(contentRange.split("/")[1]);
    } else if (res.headers.has("content-length")) {
      const contentLength = res.headers.get("content-length");
      if (contentLength) size = Number.parseInt(contentLength);
    }

    if (size > 41943040) {
      // 40 MB
      throw "large";
    }

    if (!res.body) return;

    stream = await fileTypeStream(res.body, { sampleSize: 1024 });
    if (!stream.fileType?.mime) return;
  } finally {
    clearTimeout(timeout);
  }

  if (
    ![...(typeMedia.length === 0 ? formats.image : typeMedia.flatMap((v) => formats[v]))].includes(stream.fileType.mime)
  )
    return;

  const mediaType = stream.fileType.mime.split("/")[0] as MediaTypes;
  if (!typeMedia.includes(mediaType)) return;

  const type = stream.fileType.mime;
  const ext = stream.fileType.ext;
  if (typeOnly) return { url, type, ext, mediaType };

  const reader = stream.getReader();
  const bufs: Uint8Array[] = [];
  let bufSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    bufs.push(value);
    bufSize += value.byteLength;

    if (size && bufSize >= size) break;

    if (bufSize > 41943040) {
      // 40 MB
      throw "large";
    }
  }

  const buf = Buffer.concat(bufs);
  return { buf: buf, ext, url, type, mediaType };
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
  const idealServers: Array<
    | {
        connection: MediaConnection;
        count: number;
      }
    | undefined
  > = [];
  for (const connection of connections.values()) {
    if (connection.conn.readyState !== 1) {
      continue;
    }
    if (!connection.types[object.cmd] || connection.types[object.cmd].length === 0) {
      idealServers.push(undefined);
      continue;
    }
    try {
      const count = await connection.getCount();
      idealServers.push({ connection, count });
    } catch {
      continue;
    }
  }
  if (idealServers.length === 0) throw "No available servers";
  const sorted = idealServers.filter((v) => !!v).sort((a, b) => a.count - b.count);
  if (sorted.length === 0) return;
  return (sorted.every((v) => v.count === 0) ? random(sorted) : sorted[0]).connection;
}

let running = 0;

export async function runMediaJob(params: MediaParams): Promise<{ buffer: Buffer; type: string; spoiler: boolean }> {
  if (process.env.API_TYPE === "ws") {
    const currentServer = await getIdeal(params);
    if (!currentServer)
      return {
        buffer: Buffer.alloc(0),
        type: "nocmd",
        spoiler: false,
      };
    try {
      await currentServer.queue(BigInt(params.id), params);
      const result = await currentServer.wait(BigInt(params.id));
      if (result.sent)
        return {
          buffer: result.data,
          type: "sent",
          spoiler: false,
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
      spoiler: false,
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
    return data;
  }
  throw "media_not_working";
}
