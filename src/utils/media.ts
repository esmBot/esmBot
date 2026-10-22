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
import { mediaTypes, type MediaParams, type MediaTypes } from "./types.ts";

let mediaLib: import("./mediaLib.ts").MediaLib | undefined;

interface ServerConfig {
  name: string;
  server: string;
  auth?: string;
  tls?: boolean;
}

export const formats = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heif"],
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

  const res = await fetch(media, {
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": `Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com) esmBot/${process.env.ESMBOT_VER}`,
    },
  });
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
  if (!stream.fileType?.mime) {
    await stream.cancel();
    return;
  }

  if (typeMedia.length === 0) {
    typeMedia = mediaTypes.slice(0); // clone array
  }

  if (!typeMedia.flatMap((v) => formats[v]).includes(stream.fileType.mime)) {
    await stream.cancel();
    return;
  }

  const mediaType = stream.fileType.mime.split("/")[0] as MediaTypes;
  if (!typeMedia.includes(mediaType)) {
    await stream.cancel();
    return;
  }

  const type = stream.fileType.mime;
  const ext = stream.fileType.ext;
  if (typeOnly) {
    await stream.cancel();
    return { url, type, ext, mediaType };
  }

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
      await stream.cancel();
      // 40 MB
      throw "large";
    }
  }

  if (!stream.locked) await stream.cancel();

  const buf = Buffer.concat(bufs);
  return { buf, ext, url, type, mediaType };
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
  servers = parsed.media;
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
  const all = [...connections.values()];
  const open = all.filter((c) => c.conn.readyState === 1);
  const capable = open.filter((c) => c.types[object.cmd]?.length);
  // Only say the command is unsupported if every server says so, otherwise some
  // disconnected server might support it.
  if (all.length > 0 && capable.length === 0 && open.length === all.length) return;

  const counts = await Promise.all(
    capable.map((c) =>
      c.getCount().catch((e) => {
        logger.warn(`Failed to get job count from media server ${c.host}: ${e}`);
        return Infinity;
      }),
    ),
  );
  const min = Math.min(...counts);
  if (min === Infinity) throw "No available servers";
  return random(capable.filter((_, i) => counts[i] === min));
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
