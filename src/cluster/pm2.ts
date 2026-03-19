import "dotenv/config";
import process from "node:process";
import pm2, { type ProcessDescription } from "pm2";
import logger from "#utils/logger.js";
import {
  calcShards,
  createManageServer,
  getGatewayData,
  type IncomingProcMessage,
  type ServerCountMessage,
  type ShardData,
} from "./common.ts";

let serverCount = 0;
let shardData: ShardData[] = [];
let clusterCount = 0;
let responseCount = 0;
let totalMem = 0;

process.on("message", async (packet: IncomingProcMessage) => {
  if (packet.data?.type === "getCount") {
    process.send?.({
      type: "process:msg",
      data: {
        type: "countResponse",
        serverCount,
      },
    });
  }
  if (packet.data?.type === "getMem") {
    await updateStats();
    process.send?.({
      type: "process:msg",
      data: {
        type: "memResponse",
        totalMem,
      },
    });
  }
});

function getProcesses(): Promise<ProcessDescription[]> {
  return new Promise((resolve, reject) => {
    pm2.list((err, list) => {
      if (err) reject(err);
      resolve(list.filter((v) => v.name?.includes("esmBot-proc")));
    });
  });
}

async function updateStats() {
  serverCount = 0;
  shardData = [];
  responseCount = 0;
  totalMem = process.memoryUsage().heapUsed;
  const processes = await getProcesses();
  clusterCount = processes.length;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const listener = (packet: IncomingProcMessage) => {
    if (packet.data?.type === "serverCounts") {
      const countData = packet as ServerCountMessage;
      clearTimeout(timeout);
      serverCount += countData.data.guilds;
      shardData = [...shardData, ...countData.data.shards].sort((a, b) => a.id - b.id);
      responseCount += 1;
      totalMem += countData.data.mem;
      if (responseCount >= clusterCount) {
        process.removeListener("message", listener);
        return;
      }
      timeout = setTimeout(() => {
        process.removeListener("message", listener);
        logger.error("Timed out while waiting for stats");
      }, 5000);
    }
  };
  timeout = setTimeout(() => {
    process.removeListener("message", listener);
    logger.error("Timed out while waiting for stats");
  }, 5000);
  process.on("message", listener);
  process.send?.({
    type: "process:msg",
    data: {
      type: "serverCounts",
    },
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

setInterval(updateStats, 60000); // 1 minute
setTimeout(updateStats, 10000);

logger.info("Started esmBot management process.");

(async function init() {
  logger.log("main", "Getting gateway connection data...");
  const { procAmount, shards } = await getGatewayData();
  logger.log("main", `Obtained data, connecting with ${shards} shard(s) across ${procAmount} process(es)...`);

  const runningProc = await getProcesses();
  if (runningProc.length === procAmount) {
    logger.log("main", "All processes already running");
    return;
  }

  const shardArray = [];
  for (let i = 0; i < shards; i++) {
    shardArray.push(i);
  }
  const shardArrays = calcShards(shardArray, procAmount);

  let i = 1;

  if (runningProc.length < procAmount && runningProc.length !== 0) {
    i = runningProc.length + 1;
    logger.log(
      "main",
      `Some processes already running, attempting to start ${shardArrays.length - runningProc.length} missing processes starting from ${i}...`,
    );
  }

  for (i; i <= shardArrays.length; i++) {
    await awaitStart(i, shardArrays[i - 1]);
  }

  await updateStats();
})();

function awaitStart(i: number, shardArray: number[]): Promise<void> {
  return new Promise((resolve) => {
    pm2.start(
      {
        name: `esmBot-proc${i}`,
        script: "dist/app.js",
        autorestart: true,
        exp_backoff_restart_delay: 1000,
        wait_ready: true,
        listen_timeout: 60000,
        watch: false,
        env: {
          SHARDS: JSON.stringify(shardArray),
          CLUSTER_TYPE: "pm2",
        },
      },
      (err) => {
        if (err) {
          logger.error(`Failed to start esmBot process ${i}: ${err}`);
          process.exit(0);
        } else {
          logger.info(`Started esmBot process ${i}.`);
          resolve();
        }
      },
    );
  });
}
