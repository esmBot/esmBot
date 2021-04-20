const soundPlayer = require("../../utils/soundplayer");
const MusicCommand = require("../../classes/musicCommand");
const urlRegex = /(?:\w+:)?\/\/(\S+)/;
const searchRegex = /^ytsearch:/;

class PlayCommand extends MusicCommand {
  async run() {
    if (process.env.NODE_ENV === "production") return "Music commands are coming soon, but they aren't ready yet. Stay tuned to @esmBot_ on Twitter for updates!";

    if (!this.args[0]) return `${this.message.author.mention}, you need to provide what you want to play!`;
    const query = this.args.join(" ").trim();
    const search = urlRegex.test(query) ? query : (searchRegex.test(query) ? query : `ytsearch:${query}`);
    return await soundPlayer.play(this.client, encodeURIComponent(search), this.message, true);
  }

  static description = "Plays a song or adds it to the queue";
  static aliases = ["p"];
  static arguments = ["[url]"];
}

module.exports = PlayCommand;