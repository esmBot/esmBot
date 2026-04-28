import "dotenv/config";
import cluster, { type Worker } from "node:cluster";
import process from "node:process";
import detectRuntime from "#utils/detectRuntime.js";
import logger from "#utils/logger.js";
import { getVers, initLog } from "#utils/misc.js";
import {
  calcShards,
  createManageServer,
  getGatewayData,
  type IncomingProcMessage,
  type ServerCountMessage,
  type ShardData,
} from "./common.ts";

const runtime = detectRuntime();
if (runtime.type === "deno") {
  logger.error("This clustering implementation is incompatible with Deno. Exiting now.");
  process.exit(1);
}

const processes: Worker[] = [];
const readyHandlers = new Map<number, (value?: unknown) => void>();

let serverCount = 0;
let shardData: ShardData[] = [];
let clusterCount = 0;
let responseCount = 0;
let totalMem = 0;

function updateStats(memOnly: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!memOnly) {
      serverCount = 0;
      shardData = [];
    }
    responseCount = 0;
    totalMem = process.memoryUsage().heapUsed;
    clusterCount = processes.length;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const done: boolean[] = Array(clusterCount).fill(false);
    for (const [i, worker] of processes.entries()) {
      if (!worker.isConnected()) {
        clusterCount -= 1;
        if (responseCount >= clusterCount) {
          logger.debug(
            `Stats collected (clusterCount: ${clusterCount}, responseCount: ${responseCount}, serverCount: ${serverCount}, totalMem: ${totalMem})`,
          );
          resolve();
        }
        continue;
      }

      const listener = (packet: IncomingProcMessage) => {
        if (packet.data?.type === "serverCounts") {
          const countData = packet as ServerCountMessage;
          clearTimeout(timeout);
          if (done[i]) return;
          done[i] = true;
          if (!memOnly) {
            serverCount += countData.data.guilds;
            shardData = [...shardData, ...countData.data.shards].sort((a, b) => a.id - b.id);
          }
          responseCount += 1;
          totalMem += countData.data.mem;
          if (responseCount >= clusterCount) {
            worker.off("message", listener);
            logger.debug(
              `Stats collected (clusterCount: ${clusterCount}, responseCount: ${responseCount}, serverCount: ${serverCount}, totalMem: ${totalMem})`,
            );
            resolve();
          }
          timeout = setTimeout(() => {
            worker.off("message", listener);
            reject("Timed out while waiting for stats");
          }, 5000);
        }
      };

      timeout = setTimeout(() => {
        worker.off("message", listener);
        reject("Timed out while waiting for stats");
      }, 5000);

      worker.on("message", listener);
      worker.send({
        data: {
          type: "serverCounts",
        },
      });
    }
  });
}

const broadcastTypes = ["broadcastEnd", "broadcastStart", "eval", "mediareload", "reload", "soundreload"];

function awaitStart(i: number, shardArray: number[]): Promise<Worker> {
  const worker = cluster.fork({
    SHARDS: JSON.stringify(shardArray),
    CLUSTER_TYPE: "node",
    pm_id: i,
  });

  worker.on("message", async (message: IncomingProcMessage) => {
    if (message.data?.type === "getCount") {
      worker.send({
        data: {
          type: "countResponse",
          serverCount,
        },
      });
    }
    if (message.data?.type === "getMem") {
      try {
        await updateStats(true);
      } catch (e) {
        logger.error(e);
      }
      worker.send({
        data: {
          type: "memResponse",
          totalMem,
        },
      });
    }

    // relay broadcast messages
    if (message.data && broadcastTypes.includes(message.data.type)) {
      for (const proc of processes) {
        if (proc.id === worker.id || !proc.isConnected()) continue;
        proc.send(message);
      }
    }
  });

  return new Promise((resolve, reject) => {
    const message = (msg: IncomingProcMessage) => {
      if (msg.data?.type === "ready") {
        worker.off("message", message);
        worker.off("error", error);
        worker.off("exit", exit);
        resolve(worker);
      }
    };
    const error = (e: Error) => {
      worker.off("message", message);
      worker.off("exit", exit);
      reject(e);
    };
    const exit = (c: number) => {
      worker.off("message", message);
      worker.off("error", error);
      reject(Error(`Process exited with code ${c}`));
    };

    worker.on("message", message);
    worker.once("error", error);
    worker.once("exit", exit);
  });
}

const port = process.env.CLUSTER_PORT ?? process.env.METRICS;

if (port && port !== "") {
  createManageServer(
    port,
    () => {
      return {
        shards: shardData,
        servers: serverCount,
        totalMem,
      };
    },
    (id) => {
      const proc = processes[id - 1];
      if (!proc) return false;
      proc.kill("SIGTERM");
      return true;
    },
    async () => {
      for (const [i, proc] of processes.entries()) {
        await new Promise((resolve) => {
          readyHandlers.set(i, resolve);
          proc.kill("SIGTERM");
        });
      }
    },
  );
}

await getVers();
initLog();

setInterval(() => updateStats().catch((e) => logger.error(e)), 60000); // 1 minute
setTimeout(() => updateStats().catch((e) => logger.error(e)), 10000);

logger.info("Started esmBot management process.");

logger.log("main", "Getting gateway connection data...");
const { procAmount, shards } = await getGatewayData();

logger.log("main", `Obtained data, connecting with ${shards} shard(s) across ${procAmount} process(es)...`);
const shardArray = [];
for (let i = 0; i < shards; i++) {
  shardArray.push(i);
}
const shardArrays = calcShards(shardArray, procAmount);

cluster.on("exit", async (worker, code, signal) => {
  const id = processes.findIndex((v) => worker.id === v.id);
  if (id === -1) {
    logger.error(`Unknown process with ID ${worker.id} exited, will not restart`);
    return;
  }
  logger.error(`Process ${id + 1} exited with code ${signal || code}, attempting to restart...`);
  const newWorker = await awaitStart(id + 1, shardArrays[id]);
  processes[id] = newWorker;
  readyHandlers.get(id)?.();
  readyHandlers.delete(id);
  logger.info(`Started esmBot process ${id + 1}.`);
});

cluster.setupPrimary({
  exec: "dist/app.js",
  serialization: "json",
});

for (let i = 1; i <= shardArrays.length; i++) {
  logger.info(`Starting esmBot process ${i}...`);
  const worker = await awaitStart(i, shardArrays[i - 1]);
  processes.push(worker);
  logger.info(`Started esmBot process ${i}.`);
}
