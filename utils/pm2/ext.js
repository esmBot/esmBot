import pm2 from "pm2";
import winston from "winston";

// load config from .env file
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { createServer } from "http";
import { config } from "dotenv";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

// oceanic client used for getting shard counts
import { Client } from "oceanic.js";

import database from "../database.js";
import { cpus } from "os";

const logger = winston.createLogger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    main: 3,
    debug: 4
  },
  transports: [
    new winston.transports.Console({ format: winston.format.colorize({ all: true }), stderrLevels: ["error", "warn"] })
  ],
  level: process.env.DEBUG_LOG ? "debug" : "main",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf((info) => {
      const {
        timestamp, level, message, ...args
      } = info;

      return `[${timestamp}]: [${level.toUpperCase()}] - ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ""}`;
    }),
  )
});

winston.addColors({
  info: "green",
  main: "gray",
  debug: "magenta",
  warn: "yellow",
  error: "red"
});

let serverCount = 0;
let shardCount = 0;
let clusterCount = 0;
let responseCount = 0;

let timeout;

process.on("message", (packet) => {
  if (packet.data?.type === "getCount") {
    process.send({
      type: "process:msg",
      data: {
        type: "countResponse",
        serverCount
      }
    });
  }
});

function getProcesses() {
  return new Promise((resolve, reject) => {
    pm2.list((err, list) => {
      if (err) reject(err);
      resolve(list.filter((v) => v.name.includes("esmBot-proc")));
    });
  });
}

async function updateStats() {
  serverCount = 0;
  shardCount = 0;
  clusterCount = 0;
  responseCount = 0;
  const processes = await getProcesses();
  clusterCount = processes.length;
  const listener = (packet) => {
    if (packet.data?.type === "serverCounts") {
      clearTimeout(timeout);
      serverCount += packet.data.guilds;
      shardCount += packet.data.shards;
      responseCount += 1;
      if (responseCount >= clusterCount) {
        process.removeListener("message", listener);
        return;
      } else {
        timeout = setTimeout(() => {
          process.removeListener("message", listener);
          logger.error("Timed out while waiting for stats");
        }, 5000);
      }
    }
  };
  timeout = setTimeout(() => {
    process.removeListener("message", listener);
    logger.error("Timed out while waiting for stats");
  }, 5000);
  process.on("message", listener);
  process.send({
    type: "process:msg",
    data: {
      type: "serverCounts"
    }
  });
}

if (process.env.METRICS && process.env.METRICS !== "") {
  const servers = [];
  if (process.env.API_TYPE === "ws") {
    const imageHosts = JSON.parse(readFileSync(new URL("../../config/servers.json", import.meta.url), { encoding: "utf8" })).image;
    for (let { server } of imageHosts) {
      if (!server.includes(":")) {
        server += ":3762";
      }
      servers.push(server);
    }
  }
  const httpServer = createServer(async (req, res) => {
    if (req.method !== "GET") {
      res.statusCode = 405;
      return res.end("GET only");
    }
    res.write(`# HELP esmbot_command_count Number of times a command has been run
# TYPE esmbot_command_count counter
# HELP esmbot_server_count Number of servers/guilds the bot is in
# TYPE esmbot_server_count gauge
# HELP esmbot_shard_count Number of shards the bot has
# TYPE esmbot_shard_count gauge
`);
    if (database) {
      const counts = await database.getCounts();
      for (const [i, w] of Object.entries(counts)) {
        res.write(`esmbot_command_count{command="${i}"} ${w}\n`);
      }
    }

    res.write(`esmbot_server_count ${serverCount}\n`);
    res.write(`esmbot_shard_count ${shardCount}\n`);
    res.end();
  });
  httpServer.listen(process.env.METRICS, () => {
    logger.log("info", `Serving metrics at ${process.env.METRICS}`);
  });
}

setInterval(updateStats, 300000);

setTimeout(updateStats, 10000);

logger.info("Started esmBot management process.");

// from eris-fleet
function calcShards(shards, procs) {
  if (procs < 2) return [shards];

  const length = shards.length;
  const r = [];
  let i = 0;
  let size;
  let remainder;

  if (length % procs === 0) {
    size = Math.floor(length / procs);
    remainder = size % 16;
    if (size > 16 && remainder) {
      size -= remainder;
    }
    while (i < length) {
      let added = 0;
      if (remainder) {
        added = 1;
        remainder--;
      }
      r.push(shards.slice(i, (i += size + (size * added))));
    }
  } else {
    while (i < length) {
      size = Math.ceil((length - i) / procs--);
      r.push(shards.slice(i, (i += size)));
    }
  }

  return r;
}

(async function init() {
  logger.main("Getting gateway connection data...");
  const client = new Client({
    auth: `Bot ${process.env.TOKEN}`,
    gateway: {
      concurrency: "auto",
      maxShards: "auto",
      presence: {
        status: "idle",
        activities: [{
          type: 0,
          name: "Starting esmBot..."
        }]
      },
      intents: []
    }
  });

  const connectionData = await client.rest.getBotGateway();
  const cpuAmount = cpus().length;
  const procAmount = Math.min(connectionData.shards, cpuAmount);
  logger.main(`Obtained data, connecting with ${connectionData.shards} shard(s) across ${procAmount} process(es)...`);

  const runningProc = await getProcesses();
  if (runningProc.length === procAmount) {
    logger.main("All processes already running");
    return;
  }

  const shardArray = [];
  for (let i = 0; i < connectionData.shards; i++) {
    shardArray.push(i);
  }
  const shardArrays = calcShards(shardArray, procAmount);

  let i = 0;

  if (runningProc.length < procAmount && runningProc.length !== 0) {
    i = runningProc.length;
    logger.main(`Some processes already running, attempting to start ${shardArrays.length - runningProc.length} missing processes with offset ${i}...`);
  }

  for (i; i < shardArrays.length; i++) {
    await awaitStart(i, shardArrays);
  }
  
  await updateStats();
})();

function awaitStart(i, shardArrays) {
  return new Promise((resolve) => {
    pm2.start({
      name: `esmBot-proc${i}`,
      script: "app.js",
      autorestart: true,
      exp_backoff_restart_delay: 1000,
      wait_ready: true,
      listen_timeout: 60000,
      watch: false,
      exec_mode: "cluster",
      instances: 1,
      env: {
        "SHARDS": JSON.stringify(shardArrays)
      }
    }, (err) => {
      if (err) {
        logger.error(`Failed to start esmBot process ${i}: ${err}`);
        process.exit(0);
      } else {
        logger.info(`Started esmBot process ${i}.`);
        resolve();
      }
    });
  });
}