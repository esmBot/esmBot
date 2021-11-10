import Command from "../../classes/command.js";

class ImageStatsCommand extends Command {
  async run() {
    await this.client.sendChannelTyping(this.message.channel.id);
    const servers = await this.ipc.command("image", { type: "stats" }, true);
    const embed = {
      embeds: [{
        "author": {
          "name": "esmBot Image Statistics",
          "icon_url": this.client.user.avatarURL
        },
        "color": 16711680,
        "description": `The bot is currently connected to ${servers.length} image server(s).`,
        "fields": []
      }]
    };
    for (let i = 0; i < servers.length; i++) {
      embed.embeds[0].fields.push({
        name: `Server ${i + 1}`,
        value: `Running Jobs: ${servers[i].runningJobs}\nQueued: ${servers[i].queued}\nMax Jobs: ${servers[i].max}`
      });
    }
    return embed;
  }

  static description = "Gets some statistics about the image servers";
  static aliases = ["imgstat", "imstats", "imgstats", "imstat"];
}

export default ImageStatsCommand;