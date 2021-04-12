const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class WinXPCommand extends MusicCommand {
  async run() {
    return await soundPlayer.play(this.client, "./assets/audio/winxp.ogg", this.message);
  }

  static description = "Plays the Windows XP startup sound";
  static aliases = ["windows", "xp"];
}

module.exports = WinXPCommand;