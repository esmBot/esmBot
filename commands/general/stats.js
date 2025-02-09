import packageJson from "../../package.json" with { type: "json" };
import os from "node:os";
import Command from "../../classes/command.js";
import { VERSION } from "oceanic.js";
const pm2 = process.env.PM2_USAGE ? (await import("pm2")).default : null;
import { getServers } from "../../utils/misc.js";

class StatsCommand extends Command {
  async run() {
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
    const uptime = process.uptime() * 1000;
    const connUptime = this.client.uptime;
    let owner = this.client.users.get(process.env.OWNER.split(",")[0]);
    if (!owner) owner = await this.client.rest.users.get(process.env.OWNER.split(",")[0]);
    const servers = await getServers(this.client);
    const processMem = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;
    return {
      embeds: [{
        author: {
          name: this.getString("commands.responses.stats.header"),
          iconURL: this.client.user.avatarURL()
        },
        description: this.getString("managedBy", { params: { owner: owner.username } }),
        color: 0xff0000,
        fields: [{
          name: this.getString("commands.responses.stats.version"),
          value: `v${packageJson.version}${process.env.NODE_ENV === "development" ? `-dev (${process.env.GIT_REV})` : ""}`
        },
        {
          name: this.getString("commands.responses.stats.processUsage"),
          value: processMem,
          inline: true
        },
        {
          name: this.getString("commands.responses.stats.totalUsage"),
          value: process.env.PM2_USAGE ? `${((await this.list()).reduce((prev, cur) => prev + cur.monit.memory, 0) / 1024 / 1024).toFixed(2)} MB` : processMem,
          inline: true
        },
        {
          name: this.getString("commands.responses.stats.botUptime"),
          value: this.getString("timeFormat", {
            params: {
              days: Math.trunc(uptime / 86400000),
              hours: Math.trunc(uptime / 3600000) % 24,
              minutes: Math.trunc(uptime / 60000) % 60,
              seconds: Math.trunc(uptime / 1000) % 60
            }
          })
        },
        {
          name: this.getString("commands.responses.stats.connectionUptime"),
          value: this.getString("timeFormat", {
            params: {
              days: Math.trunc(connUptime / 86400000),
              hours: Math.trunc(connUptime / 3600000) % 24,
              minutes: Math.trunc(connUptime / 60000) % 60,
              seconds: Math.trunc(connUptime / 1000) % 60
            }
          })
        },
        {
          name: this.getString("commands.responses.stats.host"),
          value: `${os.type()} ${os.release()} (${os.arch()})`,
          inline: true
        },
        {
          name: this.getString("commands.responses.stats.library"),
          value: `Oceanic ${VERSION}`,
          inline: true
        },
        {
          name: this.getString(`commands.responses.stats.${process.versions.bun ? "bunVersion" : "nodeJsVersion"}`),
          value: process.versions.bun ?? process.versions.node,
          inline: true
        },
        {
          name: this.getString("commands.responses.stats.shard"),
          value: this.guild ? this.client.guildShardMap[this.guild.id] : "N/A",
          inline: true
        },
        {
          name: this.getString("commands.responses.stats.servers"),
          value: servers ? servers : this.getString("commands.responses.stats.processOnly", { params: { count: this.client.guilds.size } }),
          inline: true
        }
        ]
      }]
    };
  }

  list() {
    return new Promise((resolve, reject) => {
      pm2.list((err, list) => {
        if (err) return reject(err);
        resolve(list.filter((v) => v.name.includes("esmBot-proc")));
      });
    });
  }

  static description = "Gets some statistics about me";
  static aliases = ["status", "stat"];
}

export default StatsCommand;