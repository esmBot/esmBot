import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";
const prefixes = ["scsearch:", "spsearch:", "sprec:", "amsearch:", "dzsearch:", "dzisrc:"];
if (process.env.YT_DISABLED !== "true") prefixes.push("ytsearch:", "ytmsearch:");

class PlayCommand extends MusicCommand {
  async run() {
    if (!this.guild) {
      this.success = false;
      return "This command only works in servers!";
    }
    const input = this.options.query ?? this.args.join(" ");
    if (!input && (!this.message || this.message?.attachments.size <= 0)) {
      this.success = false;
      return "You need to provide what you want to play!";
    }
    let query = input ? input.trim() : "";
    const attachment = this.type === "classic" ? this.message?.attachments.first() : undefined;
    if (query.startsWith("||") && query.endsWith("||")) {
      query = query.slice(2, -2);
    }
    if (query.startsWith("<") && query.endsWith(">")) {
      query = query.slice(1, -1);
    }
    try {
      const url = new URL(query);
      return play(this.client, url.toString(), { channel: this.channel, guild: this.guild, member: this.member, type: this.type, interaction: this.interaction });
    } catch {
      const search = prefixes.some(v => query.startsWith(v)) ? query : !query && attachment ? attachment.url : (process.env.YT_DISABLED !== "true" ? `ytsearch:${query}` : `dzsearch:${query}`);
      return play(this.client, search, { channel: this.channel, guild: this.guild, member: this.member, type: this.type, interaction: this.interaction });
    }
  }

  static flags = [{
    name: "query",
    type: 3,
    description: "An audio search query or URL",
    classic: true,
    required: true
  }];
  static description = "Plays a song or adds it to the queue";
  static aliases = ["p"];
}

export default PlayCommand;
