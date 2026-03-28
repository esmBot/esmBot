import os from "node:os";
import process from "node:process";
import { VERSION } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import detectRuntime from "#utils/detectRuntime.js";
import { getServers } from "#utils/misc.js";
import packageJson from "../../package.json" with { type: "json" };

const pm2 = process.env.CLUSTER_TYPE === "pm2" ? (await import("pm2")).default : null;

class StatsCommand extends Command {
  async run() {
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
    const uptime = process.uptime() * 1000;
    const connUptime = this.client.uptime;
    const owners = process.env.OWNER?.split(",") ?? [];
    let owner;
    if (owners.length !== 0) {
      owner = this.client.users.get(owners[0]) ?? (await this.client.rest.users.get(owners[0]));
    }
    const servers = await getServers(this.client);
    const processMem = `${(process.memoryUsage().heapUsed / 1000 / 1000).toFixed(2)} MB`;
    const runtime = detectRuntime();
    return {
      embeds: [
        {
          author: {
            name: this.getString("commands.responses.stats.header"),
            iconURL: this.client.user.avatarURL(),
          },
          description: this.getString("managedBy", { params: { owner: owner?.username ?? "N/A" } }),
          color: 0xff0000,
          fields: [
            {
              name: this.getString("commands.responses.stats.version"),
              value: `v${packageJson.version}${process.env.NODE_ENV === "development" ? `-dev (${process.env.GIT_REV})` : ""}`,
            },
            {
              name: this.getString("commands.responses.stats.processUsage"),
              value: processMem,
              inline: true,
            },
            {
              name: this.getString("commands.responses.stats.totalUsage"),
              value: (await this.getMem()) ?? processMem,
              inline: true,
            },
            {
              name: this.getString("commands.responses.stats.botUptime"),
              value: this.getString("timeFormat", {
                params: {
                  days: Math.trunc(uptime / 86400000).toString(),
                  hours: (Math.trunc(uptime / 3600000) % 24).toString(),
                  minutes: (Math.trunc(uptime / 60000) % 60).toString(),
                  seconds: (Math.trunc(uptime / 1000) % 60).toString(),
                },
              }),
            },
            {
              name: this.getString("commands.responses.stats.connectionUptime"),
              value: this.getString("timeFormat", {
                params: {
                  days: Math.trunc(connUptime / 86400000).toString(),
                  hours: (Math.trunc(connUptime / 3600000) % 24).toString(),
                  minutes: (Math.trunc(connUptime / 60000) % 60).toString(),
                  seconds: (Math.trunc(connUptime / 1000) % 60).toString(),
                },
              }),
            },
            {
              name: this.getString("commands.responses.stats.host"),
              value: `${os.type()} ${os.release()} (${os.arch()})`,
              inline: true,
            },
            {
              name: this.getString("commands.responses.stats.library"),
              value: `Oceanic ${VERSION}`,
              inline: true,
            },
            {
              name: this.getString(`commands.responses.stats.${runtime.type}Version`),
              value: runtime.version ?? "N/A",
              inline: true,
            },
            {
              name: this.getString("commands.responses.stats.shard"),
              value: this.guild ? (this.client.guildShardMap.get(this.guild.id)?.toString() ?? "N/A") : "N/A",
              inline: true,
            },
            {
              name: this.getString("commands.responses.stats.servers"),
              value: servers
                ? servers.toString()
                : this.getString("commands.responses.stats.processOnly", {
                    params: { count: this.client.guilds.size.toString() },
                  }),
              inline: true,
            },
          ],
        },
      ],
    };
  }

  /**
   * @returns {Promise<string | null>}
   */
  getMem() {
    if (pm2) {
      return new Promise((resolve, reject) => {
        pm2.list((err, list) => {
          if (err) return reject(err);
          const procList = list.filter((v) => v.name?.includes("esmBot-proc"));
          const value = procList.reduce((prev, cur) => prev + (cur.monit?.memory ?? 0), 0) / 1000 / 1000;
          resolve(`${value.toFixed(2)} MB`);
        });
      });
    } else if (process.env.CLUSTER_TYPE === "node") {
      return new Promise((resolve, reject) => {
        const listener = (/** @type {{ data: { type: string; totalMem: number; }; }} */ message) => {
          if (message.data?.type === "memResponse") {
            clearTimeout(timeout);
            const value = message.data.totalMem / 1000 / 1000;
            resolve(`${value.toFixed(2)} MB`);
            process.off("message", listener);
          }
        };
        process.on("message", listener);
        const timeout = setTimeout(() => {
          process.off("message", listener);
          reject("Timed out");
        }, 3000);
        process.send?.({
          data: {
            type: "getMem",
          },
        });
      });
    } else {
      return Promise.resolve(null);
    }
  }

  static description = "Gets some statistics about me";
  static aliases = ["status", "stat"];
}

export default StatsCommand;
