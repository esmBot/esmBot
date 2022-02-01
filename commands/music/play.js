import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class PlayCommand extends MusicCommand {
  async run() {
    if (!this.args[0] && this.message.attachments.length <= 0) return "You need to provide what you want to play!";
    let query = this.args.join(" ").trim();
    const attachment = this.message.attachments[0];
    if (query.startsWith("||") && query.endsWith("||")) {
      query = query.substring(2, query.length - 2);
    }
    if (query.startsWith("<") && query.endsWith(">")) {
      query = query.substring(1, query.length - 1);
    }
    try {
      const url = new URL(query);
      return await play(this.client, url, this.message, true);
    } catch {
      const search = query.startsWith("ytsearch:") ? query : !this.args[0] && attachment ? attachment.url : `ytsearch:${query}`;
      return await play(this.client, search, this.message, true);
    }
  }

  static description = "Plays a song or adds it to the queue";
  static aliases = ["p"];
  static arguments = ["[url]"];
}

export default PlayCommand;
