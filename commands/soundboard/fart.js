const soundPlayer = require("../../utils/soundplayer");
const MusicCommand = require("../../classes/musicCommand");

class FartCommand extends MusicCommand {
  async run() {
    return await soundPlayer.play(this.client, "./assets/audio/fart.ogg", this.message);
  }

  static description = "Plays a fart sound effect";
  static aliases = ["toot"];
}

module.exports = FartCommand;