const soundPlayer = require("../../utils/soundplayer");
const MusicCommand = require("../../classes/musicCommand");

class BoomCommand extends MusicCommand {
  async run() {
    return await soundPlayer.play(this.client, "./assets/audio/boom.ogg", this.message);
  }

  static description = "Plays the Vine boom sound effect";
  static aliases = ["thud", "vine"];
}

module.exports = BoomCommand;