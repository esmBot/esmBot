import { readFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
const { version } = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url)));
import os from "os";
import Command from "../../classes/command.js";
import { VERSION } from "eris";
import { exec as baseExec } from "child_process";
import { promisify } from "util";
const exec = promisify(baseExec);

class StatsCommand extends Command {
  async run() {
    const uptime = process.uptime() * 1000;
    const connUptime = this.client.uptime;
    const owner = await this.ipc.fetchUser(process.env.OWNER.split(",")[0]);
    const stats = await this.ipc.getStats();
    return {
      embeds: [{
        "author": {
          "name": "esmBot Statistics",
          "icon_url": this.client.user.avatarURL
        },
        "description": `This instance is managed by **${owner.username}#${owner.discriminator}**.`,
        "color": 16711680,
        "fields": [{
          "name": "Version",
          "value": `v${version}${process.env.NODE_ENV === "development" ? `-dev (${(await exec("git rev-parse HEAD", { cwd: dirname(fileURLToPath(import.meta.url)) })).stdout.substring(0, 7)})` : ""}`
        },
        {
          "name": "Cluster Memory Usage",
          "value": stats && stats.clusters[this.cluster] ? `${stats.clusters[this.cluster].ram.toFixed(2)} MB` : `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
          "inline": true
        },
        {
          "name": "Total Memory Usage",
          "value": stats && stats.totalRam ? `${stats.totalRam.toFixed(2)} MB` : "Unknown",
          "inline": true
        },
        {
          "name": "Bot Uptime",
          "value": `${Math.trunc(uptime / 86400000)} days, ${Math.trunc(uptime / 3600000) % 24} hrs, ${Math.trunc(uptime / 60000) % 60} mins, ${Math.trunc(uptime / 1000) % 60} secs`
        },
        {
          "name": "Connection Uptime",
          "value": `${Math.trunc(connUptime / 86400000)} days, ${Math.trunc(connUptime / 3600000) % 24} hrs, ${Math.trunc(connUptime / 60000) % 60} mins, ${Math.trunc(connUptime / 1000) % 60} secs`
        },
        {
          "name": "Host",
          "value": `${os.type()} ${os.release()} (${os.arch()})`,
          "inline": true
        },
        {
          "name": "Library",
          "value": `Eris ${VERSION}`,
          "inline": true
        },
        {
          "name": "Node.js Version",
          "value": process.version,
          "inline": true
        },
        {
          "name": "Shard",
          "value": this.message.channel.guild ? this.client.guildShardMap[this.message.channel.guild.id] : "N/A",
          "inline": true
        },
        {
          "name": "Cluster",
          "value": this.cluster,
          "inline": true
        },
        {
          "name": "Servers",
          "value": stats && stats.guilds ? stats.guilds : `${this.client.guilds.size} (for this cluster only)`,
          "inline": true
        }
        ]
      }]
    };
  }

  static description = "Gets some statistics about me";
  static aliases = ["status", "stat"];
}

export default StatsCommand;