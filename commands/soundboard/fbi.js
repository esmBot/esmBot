const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class FBICommand extends MusicCommand {
  async run() {
    return await soundPlayer.play(this.client, "./assets/audio/fbi.ogg", this.message);
  }

  static description = "Plays the \"FBI OPEN UP\" sound effect";
  static aliases = ["openup"];
}

module.exports = FBICommand;