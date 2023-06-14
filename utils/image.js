import { request } from "undici";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";
import { createRequire } from "module";
import { fileTypeFromBuffer, fileTypeFromFile } from "file-type";
import * as logger from "./logger.js";
import ImageConnection from "./imageConnection.js";

// only requiring this to work around an issue regarding worker threads
const nodeRequire = createRequire(import.meta.url);
if (!process.env.API_TYPE || process.env.API_TYPE === "none") {
  nodeRequire(`../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/image.node`);
}

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"];
export const connections = new Map();
export let servers = process.env.API_TYPE === "ws" ? JSON.parse(fs.readFileSync(new URL("../config/servers.json", import.meta.url), { encoding: "utf8" })).image : null;

export async function getType(image, extraReturnTypes) {
  if (!image.startsWith("http")) {
    const imageType = await fileTypeFromFile(image);
    if (imageType && formats.includes(imageType.mime)) {
      return imageType.mime;
    }
    return undefined;
  }
  let type;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 3000);
  try {
    const imageRequest = await request(image, {
      signal: controller.signal,
      method: "HEAD"
    });
    clearTimeout(timeout);
    const size = imageRequest.headers["content-range"] ? imageRequest.headers["content-range"].split("/")[1] : imageRequest.headers["content-length"];
    if (parseInt(size) > 41943040 && extraReturnTypes) { // 40 MB
      type = "large";
      return type;
    }
    const typeHeader = imageRequest.headers["content-type"];
    if (typeHeader) {
      type = typeHeader;
    } else {
      const timeout = setTimeout(() => {
        controller.abort();
      }, 3000);
      const bufRequest = await request(image, {
        signal: controller.signal,
        headers: {
          range: "bytes=0-1023"
        }
      });
      clearTimeout(timeout);
      const imageBuffer = await bufRequest.body.arrayBuffer();
      const imageType = await fileTypeFromBuffer(imageBuffer);
      if (imageType && formats.includes(imageType.mime)) {
        type = imageType.mime;
      }
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw Error(`Timed out when requesting ${image}`);
    } else {
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
  return type;
}

function connect(server, auth) {
  const connection = new ImageConnection(server, auth);
  connections.set(server, connection);
}

function disconnect() {
  for (const connection of connections.values()) {
    connection.close();
  }
  connections.clear();
}

async function repopulate() {
  const data = await fs.promises.readFile(new URL("../config/servers.json", import.meta.url), { encoding: "utf8" });
  servers = JSON.parse(data).image;
}

export async function reloadImageConnections() {
  disconnect();
  await repopulate();
  let amount = 0;
  for (const server of servers) {
    try {
      connect(server.server, server.auth);
      amount += 1;
    } catch (e) {
      logger.error(e);
    }
  }
  return amount;
}

function chooseServer(ideal) {
  if (ideal.length === 0) throw "No available servers";
  const sorted = ideal.filter((v) => !!v).sort((a, b) => {
    return a.load - b.load;
  });
  return sorted[0];
}

async function getIdeal(object) {
  const idealServers = [];
  for (const [address, connection] of connections) {
    if (connection.conn.readyState !== 0 && connection.conn.readyState !== 1) {
      continue;
    }
    if (!connection.funcs.includes(object.cmd)) {
      idealServers.push(null);
      continue;
    }
    if (object.params.type && !connection.formats[object.cmd]?.includes(object.params.type)) continue;
    idealServers.push({
      addr: address,
      load: await connection.getCount()
    });
  }
  const server = chooseServer(idealServers);
  if (!server) return;
  return connections.get(server.addr);
}

function waitForWorker(worker) {
  return new Promise((resolve, reject) => {
    worker.once("message", (data) => {
      resolve({
        buffer: Buffer.from([...data.buffer]),
        type: data.fileExtension
      });
    });
    worker.once("error", reject);
  });
}

export async function runImageJob(params) {
  if (process.env.API_TYPE === "ws") {
    for (let i = 0; i < 3; i++) {
      const currentServer = await getIdeal(params);
      if (!currentServer) return {
        type: "nocmd"
      };
      try {
        await currentServer.queue(BigInt(params.id), params);
        await currentServer.wait(BigInt(params.id));
        const output = await currentServer.getOutput(params.id);
        return output;
      } catch (e) {
        if (i >= 2 && e !== "Request ended prematurely due to a closed connection") {
          if (e === "No available servers" && i >= 2) throw "Request ended prematurely due to a closed connection";
          throw e;
        }
      }
    }
  } else {
    // Called from command (not using image API)
    const worker = new Worker(path.join(path.dirname(fileURLToPath(import.meta.url)), "./image-runner.js"), {
      workerData: params
    });
    return await waitForWorker(worker);
  }
}