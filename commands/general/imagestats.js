const image = require("../../utils/image");
const Command = require("../../classes/command");

class ImageStatsCommand extends Command {
  async run() {
    const embed = {
      embed: {
        "author": {
          "name": "esmBot Image Statistics",
          "icon_url": this.client.user.avatarURL
        },
        "color": 16711680,
        "description": `The bot is currently connected to ${image.connections.length} image server(s).`,
        "fields": []
      }
    };
    const servers = await image.getStatus();
    for (let i = 0; i < servers.length; i++) {
      embed.embed.fields.push({
        name: `Server ${i + 1}`,
        value: `Running Jobs: ${servers[i].runningJobs}\nQueued: ${servers[i].queued}\nMax Jobs: ${servers[i].max}`
      });
    }
    return embed;
  }

  static description = "Gets some statistics about the image servers";
  static aliases = ["imgstat", "imstats", "imgstats", "imstat"];
}

module.exports = ImageStatsCommand;