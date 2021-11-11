import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";
const urlRegex = /(?:\w+:)?\/\/(\S+)/;
const searchRegex = /^ytsearch:/;

class PlayCommand extends MusicCommand {
  async run() {
    if (!this.args[0] && this.message.attachments.length <= 0) return "You need to provide what you want to play!";
    const query = this.args.join(" ").trim();
    const attachment = this.message.attachments[0];
    const search = urlRegex.test(query) ? query : searchRegex.test(query) ? query : !this.args[0] && attachment ? attachment.url : `ytsearch:${query}`;
    return await play(this.client, search, this.message, true);
  }

  static description = "Plays a song or adds it to the queue";
  static aliases = ["p"];
  static arguments = ["[url]"];
}

export default PlayCommand;
