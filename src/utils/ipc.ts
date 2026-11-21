import type { Client } from "oceanic.js";
import { getEnv } from "./runtime.ts";

export function getServers(bot: Client): Promise<number> {
  return new Promise((resolve, reject) => {
    if (getEnv("CLUSTER_TYPE") === "node") {
      const listener = (packet: { data: { type: string; serverCount: number } }) => {
        if (packet.data?.type === "countResponse") {
          clearTimeout(timeout);
          resolve(packet.data.serverCount);
          process.off("message", listener);
        }
      };
      process.on("message", listener);

      const timeout = setTimeout(() => {
        process.off("message", listener);
        reject(Error("Timed out while getting server count"));
      }, 3000);

      process.send?.({
        data: {
          type: "getCount",
        },
      });
    } else {
      resolve(bot.guilds.size);
    }
  });
}

export function sendIPCMessage(type: string, message?: string) {
  if (getEnv("CLUSTER_TYPE")) {
    process.send?.({
      type: "process:msg",
      data: {
        type,
        from: getEnv("pm_id"),
        message,
      },
    });
  }
}
