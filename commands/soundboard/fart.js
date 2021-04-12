const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class FartCommand extends MusicCommand {
  async run() {
    return await soundPlayer.play(this.client, "./assets/audio/fart.ogg", this.message);
  }

  static description = "Plays a fart sound effect";
  static aliases = ["toot"];
}

module.exports = FartCommand;