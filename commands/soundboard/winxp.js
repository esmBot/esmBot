const SoundCommand = require("../../classes/soundCommand");

class WinXPCommand extends SoundCommand {
  sound = "winxp.ogg";

  static description = "Plays the Windows XP startup sound";
  static aliases = ["windows", "xp"];
}

module.exports = WinXPCommand;