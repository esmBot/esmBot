import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class PlayCommand extends MusicCommand {
  async run() {
    const input = this.type === "classic" ? this.args.join(" ") : this.options.query;
    if (!input && (this.type === "classic" ? (!this.message || this.message.attachments.length <= 0) : !this.options.file)) return "You need to provide what you want to play!";
    let query = input ? input.trim() : "";
    const attachment = this.type === "classic" ? this.message.attachments[0] : this.interaction.data.resolved.attachments[this.options.file];
    if (query.startsWith("||") && query.endsWith("||")) {
      query = query.substring(2, query.length - 2);
    }
    if (query.startsWith("<") && query.endsWith(">")) {
      query = query.substring(1, query.length - 1);
    }
    try {
      const url = new URL(query);
      return await play(this.client, url, { channel: this.channel, author: this.author, type: this.type, interaction: this.interaction }, true);
    } catch {
      const search = query.startsWith("ytsearch:") ? query : !query && attachment ? attachment.url : `ytsearch:${query}`;
      return await play(this.client, search, { channel: this.channel, author: this.author, type: this.type, interaction: this.interaction }, true);
    }
  }

  static flags = [{
    name: "file",
    type: 11,
    description: "An audio file attachment"
  }, {
    name: "query",
    type: 3,
    description: "An audio search query or URL"
  }];
  static description = "Plays a song or adds it to the queue";
  static aliases = ["p"];
  static arguments = ["[url]"];
}

export default PlayCommand;
