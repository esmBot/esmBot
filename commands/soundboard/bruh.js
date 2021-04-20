const soundPlayer = require("../../utils/soundplayer");
const MusicCommand = require("../../classes/musicCommand");

class BruhCommand extends MusicCommand {
  async run() {
    return await soundPlayer.play(this.client, "./assets/audio/bruh.ogg", this.message);
  }

  static description = "Plays the \"bruh\" sound effect";
  static aliases = ["bro"];
}

module.exports = BruhCommand;