const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class OofCommand extends MusicCommand {
  async run() {
    return await soundPlayer.play(this.client, "./assets/audio/oof.ogg", this.message);
  }

  static description = "Plays the Roblox \"oof\" sound";
  static aliases = ["roblox", "commitdie"];
}

module.exports = OofCommand;