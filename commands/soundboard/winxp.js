const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class WinXPCommand extends MusicCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    return await soundPlayer.play("./assets/audio/winxp.ogg", this.message);
  }

  static description = "Plays the Windows XP startup sound";
  static aliases = ["windows", "xp"];
}

module.exports = WinXPCommand;