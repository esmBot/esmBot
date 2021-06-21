const { version } = require("../../package.json");
const collections = require("../../utils/collections.js");
const day = require("dayjs");
day.extend(require("dayjs/plugin/duration"));
const os = require("os");
const Command = require("../../classes/command.js");

class StatsCommand extends Command {
  async run() {
    const duration = day.duration(this.client.uptime).format(" D [days], H [hrs], m [mins], s [secs]");
    const uptime = day.duration(process.uptime(), "seconds").format(" D [days], H [hrs], m [mins], s [secs]");
    const owner = this.client.users.get(process.env.OWNER);
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
          "value": `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
          "inline": true
        },
        {
          "name": "Total Memory Usage",
          "value": collections.stats.totalRam ? `${collections.stats.totalRam.toFixed(2)} MB` : "Unknown",
          "inline": true
        },
        {
          "name": "Bot Uptime",
          "value": uptime
        },
        {
          "name": "Connection Uptime",
          "value": duration
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
        }
        ]
      }
    };
  }

  static description = "Gets some statistics about me";
  static aliases = ["status", "stat"];
}

module.exports = StatsCommand;