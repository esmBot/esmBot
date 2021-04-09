const { version } = require("../../package.json");
const day = require("dayjs");
day.extend(require("dayjs/plugin/duration"));
const os = require("os");
const Command = require("../../classes/command.js");

class StatsCommand extends Command {
  async run() {
    const duration = day.duration(this.client.uptime).format(" D [days], H [hrs], m [mins], s [secs]");
    const uptime = day.duration(process.uptime(), "seconds").format(" D [days], H [hrs], m [mins], s [secs]");
    return {
      embed: {
        "author": {
          "name": "esmBot Statistics",
          "icon_url": this.client.user.avatarURL
        },
        "color": 16711680,
        "fields": [{
          "name": "Version",
          "value": `v${version}${process.env.NODE_ENV === "development" ? "-dev" : ""}`
        },
        {
          "name": "Memory Usage",
          "value": `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
        },
        {
          "name": "Shard",
          "value": this.client.guildShardMap[this.message.channel.guild.id]
        },
        {
          "name": "Uptime",
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
          "value": `Eris ${require("eris").VERSION}`
        },
        {
          "name": "Node.js Version",
          "value": process.version
        }
        ]
      }
    };
  }

  static description = "Gets some statistics about me";
  static aliases = ["status", "stat"];
}

module.exports = StatsCommand;