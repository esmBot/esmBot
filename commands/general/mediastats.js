import Command from "#cmd-classes/command.js";
import { connections } from "#utils/media.js";

class MediaStatsCommand extends Command {
  async run() {
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
    await this.acknowledge();
    const embed = {
      embeds: [
        {
          author: {
            name: this.getString("commands.responses.mediastats.header"),
            iconURL: this.client.user.avatarURL(),
          },
          color: 0xff0000,
          description: this.getString("commands.responses.mediastats.connected", {
            params: { length: connections.size.toString() },
          }),
          fields: [{ name: "", value: "" }],
        },
      ],
    };
    embed.embeds[0].fields = [];
    let i = 0;
    for (const connection of connections.values()) {
      const count = await connection.getCount();
      embed.embeds[0].fields.push({
        name: this.getString("commands.responses.mediastats.server", {
          params: { num: (connection.name ? `${i++} (${connection.name})` : i++).toString() },
        }),
        value: this.getString("commands.responses.mediastats.runningJobs", { params: { count: count.toString() } }),
      });
    }
    return embed;
  }

  static description = "Gets some statistics about the media servers";
  static aliases = ["imgstat", "imstats", "imgstats", "imstat", "imagestats", "mstat", "mstats"];
}

export default MediaStatsCommand;
