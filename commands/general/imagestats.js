import Command from "../../classes/command.js";
import { connections } from "../../utils/image.js";

class ImageStatsCommand extends Command {
  async run() {
    await this.acknowledge();
    const embed = {
      embeds: [{
        author: {
          name: "esmBot Image Statistics",
          iconURL: this.client.user.avatarURL()
        },
        color: 16711680,
        description: `The bot is currently connected to ${connections.size} image server(s).`,
        fields: []
      }]
    };
    let i = 0;
    for (const connection of connections.values()) {
      const count = await connection.getCount();
      if (!count) continue;
      embed.embeds[0].fields.push({
        name: `Server ${i++}`,
        value: `Running Jobs: ${count}`
      });
    }
    return embed;
  }

  static description = "Gets some statistics about the image servers";
  static aliases = ["imgstat", "imstats", "imgstats", "imstat"];
}

export default ImageStatsCommand;
