const { version } = require("../../package.json");
const os = require("os");
const Command = require("../../classes/command.js");

class StatsCommand extends Command {
  async run() {
    const uptime = process.uptime();
    const connUptime = this.client.uptime;
    const owner = await this.ipc.fetchUser(process.env.OWNER);
    const stats = await this.ipc.getStats();
    return {
      embed: {
        "author": {
          "name": "esmBot Statistics",
          "icon_url": this.client.user.avatarURL
        },
        "description": `This instance is managed by **${owner.username}#${owner.discriminator}**.`,
        "color": 16711680,
        "fields": [{
          "name": "Version",
          "value": `v${version}${process.env.NODE_ENV === "development" ? "-dev" : ""}`
        },
        {
          "name": "Cluster Memory Usage",
          "value": `${stats.clusters[this.cluster].ram.toFixed(2)} MB`,
          "inline": true
        },
        {
          "name": "Total Memory Usage",
          "value": stats.totalRam ? `${stats.totalRam.toFixed(2)} MB` : "Unknown",
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
          "value": `${os.type()} ${os.release()} (${os.arch()})`
        },
        {
          "name": "Library",
          "value": `Eris ${require("eris").VERSION}`,
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
          "value": stats.guilds ? stats.guilds : `${this.client.guilds.size} (for this cluster only)`,
          "inline": true
        },
        {
          "name": "Users (approximation)",
          "value": stats.users ? stats.users : `${this.client.users.size} (for this cluster only)`,
          "inline": true
        }
        ]
      }
    };
  }

  static description = "Gets some statistics about me";
  static aliases = ["status", "stat"];
}

module.exports = StatsCommand;