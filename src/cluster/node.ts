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

let serverCount = 0;
let shardData: ShardData[] = [];
let shardArrays: number[][];
let clusterCount = 0;
let responseCount = 0;
let totalMem = 0;

let timeout: ReturnType<typeof setTimeout> | undefined;

cluster.on("exit", async (worker, code, signal) => {
  const id = processes.findIndex((v) => worker.id === v.id);
  if (id === -1) {
    logger.error(`Unknown process with ID ${worker.id} exited, will not restart`);
    return;
  }
  logger.error(`Process ${id + 1} exited with code ${signal || code}, attempting to restart...`);
  const newWorker = await awaitStart(id + 1, shardArrays[id]);
  processes[id] = newWorker;
  logger.info(`Started esmBot process ${id + 1}.`);
});

async function updateStats() {
  serverCount = 0;
  shardData = [];
  clusterCount = 0;
  responseCount = 0;
  totalMem = process.memoryUsage().heapUsed;
  clusterCount = processes.length;
  for (const worker of processes) {
    const listener = (packet: IncomingProcMessage) => {
      if (packet.data?.type === "serverCounts") {
        const countData = packet as ServerCountMessage;
        clearTimeout(timeout);
        serverCount += countData.data.guilds;
        shardData = [...shardData, ...countData.data.shards].sort((a, b) => a.id - b.id);
        responseCount += 1;
        totalMem += countData.data.mem;
        if (responseCount >= clusterCount) {
          worker.off("message", listener);
          logger.debug(
            `Stats collected (clusterCount: ${clusterCount}, responseCount: ${responseCount}, serverCount: ${serverCount}, totalMem: ${totalMem})`,
          );
          return;
        }
        timeout = setTimeout(() => {
          worker.off("message", listener);
          logger.error("Timed out while waiting for stats");
        }, 5000);
      }
    };

    timeout = setTimeout(() => {
      worker.off("message", listener);
      logger.error("Timed out while waiting for stats");
    }, 5000);

    worker.on("message", listener);
    worker.send({
      data: {
        type: "serverCounts",
      },
    });
  }
}

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
      await updateStats();
      worker.send({
        data: {
          type: "memResponse",
          totalMem,
        },
      });
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

if (process.env.METRICS && process.env.METRICS !== "") {
  createManageServer(() => {
    return {
      shards: shardData,
      servers: serverCount,
      totalMem,
    };
  });
}

await getVers();
initLog();

setInterval(updateStats, 60000); // 1 minute
setTimeout(updateStats, 10000);

logger.info("Started esmBot management process.");

logger.log("main", "Getting gateway connection data...");
const { procAmount, shards } = await getGatewayData();

logger.log("main", `Obtained data, connecting with ${shards} shard(s) across ${procAmount} process(es)...`);
const shardArray = [];
for (let i = 0; i < shards; i++) {
  shardArray.push(i);
}
shardArrays = calcShards(shardArray, procAmount);

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
