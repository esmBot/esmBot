import { createServer } from "node:http";
import { availableParallelism } from "node:os";
import type { ShardStatus } from "oceanic.js";
import logger from "#utils/logger.js";
import { init as dbInit } from "../database.ts";

export type ShardData = {
  id: number;
  procId: number;
  latency: number;
  status: ShardStatus;
};

type BaseProcMessage = {
  data?: {
    type: string;
  };
};

export type ServerCountMessage = {
  data: {
    type: "serverCounts";
    guilds: number;
    mem: number;
    shards: ShardData[];
  };
};

export type IncomingProcMessage = BaseProcMessage | ServerCountMessage;

export async function getGatewayData() {
  const base =
    process.env.REST_PROXY && process.env.REST_PROXY !== "" ? process.env.REST_PROXY : "https://discord.com/api/v10";

  const request = await fetch(`${base}/gateway/bot`, {
    headers: {
      Authorization: `Bot ${process.env.TOKEN}`,
    },
  });
  if (!request.ok) {
    throw new Error(`Failed to get gateway connection data: ${request.statusText}`);
  }

  const connectionData = (await request.json()) as {
    shards?: number;
    message: string;
  };
  if (!connectionData.shards) {
    throw new Error(`Failed to read gateway connection data: ${connectionData.message}`);
  }

  const cpuAmount = availableParallelism();
  const procAmount = Math.min(connectionData.shards, cpuAmount);
  return {
    procAmount,
    shards: connectionData.shards,
  };
}

// from eris-fleet
export function calcShards(shards: number[], procs: number) {
  if (procs < 2) return [shards];

  const length = shards.length;
  const r = [];
  let i = 0;
  let size: number;
  let remainder: number;
  let processes = procs;

  if (length % processes === 0) {
    size = Math.floor(length / processes);
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
      const end = i + size + size * added;
      r.push(shards.slice(i, end));
      i = end;
    }
  } else {
    while (i < length) {
      size = Math.ceil((length - i) / processes--);
      r.push(shards.slice(i, i + size));
      i += size;
    }
  }

  return r;
}

interface MetricsInfo {
  shards: ShardData[];
  servers: number;
  totalMem: number;
}

export async function createManageServer(metrics: () => MetricsInfo) {
  const database = await dbInit();
  const httpServer = createServer(async (req, res) => {
    if (req.method !== "GET") {
      res.statusCode = 405;
      return res.end("GET only");
    }
    if (!req.url) throw Error("URL not found");

    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    if (reqUrl.pathname === "/" || reqUrl.pathname === "/metrics") {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.write(`# HELP esmbot_command_count Number of times a command has been run
# TYPE esmbot_command_count counter
`);
      if (database) {
        const counts = await database.getCounts(true);
        for (const [i, w] of counts.entries()) {
          res.write(`esmbot_command_count{command="${i}"} ${w}\n`);
        }
      }

      const info = metrics();

      res.write(`# HELP esmbot_servers Number of servers/guilds the bot is in
# TYPE esmbot_servers gauge
esmbot_servers ${info.servers}
# HELP esmbot_shards Number of shards the bot has
# TYPE esmbot_shards gauge
esmbot_shards ${info.shards.length}
# HELP esmbot_shard_ping Latency of each of the bot's shards
# TYPE esmbot_shard_ping gauge
`);

      for (const shard of info.shards) {
        if (shard.latency)
          res.write(`esmbot_shard_ping{shard="${shard.id}", status="${shard.status}"} ${shard.latency}\n`);
      }

      res.write(`# HELP esmbot_total_mem Total memory usage of the bot
# TYPE esmbot_total_mem gauge ${info.totalMem}
`);

      res.end();
    } else if (reqUrl.pathname === "/shard") {
      if (!reqUrl.searchParams.has("id")) {
        res.statusCode = 400;
        return res.end("400 Bad Request");
      }
      const id = Number(reqUrl.searchParams.get("id"));
      const info = metrics();
      if (!info.shards[id]) {
        res.statusCode = 400;
        return res.end("400 Bad Request");
      }
      return res.end(JSON.stringify(info.shards[id]));
    } else if (reqUrl.pathname === "/proc") {
      if (!reqUrl.searchParams.has("id")) {
        res.statusCode = 400;
        return res.end("400 Bad Request");
      }
      const id = Number(reqUrl.searchParams.get("id"));
      const info = metrics();
      const procData = info.shards.filter((v) => v.procId === id);
      if (procData.length === 0) {
        res.statusCode = 400;
        return res.end("400 Bad Request");
      }
      return res.end(JSON.stringify(procData));
    } else {
      res.statusCode = 404;
      return res.end("404 Not Found");
    }
  });
  httpServer.listen(process.env.METRICS, () => {
    logger.log("info", `Serving metrics at ${process.env.METRICS}`);
  });
  return httpServer;
}
