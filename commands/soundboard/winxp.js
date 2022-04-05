import SoundboardCommand from "../../classes/soundboardCommand.js";

class WinXPCommand extends SoundboardCommand {
  static file = "./assets/audio/winxp.ogg";
  static description = "Plays the Windows XP startup sound";
  static aliases = ["windows", "xp"];
}

export default WinXPCommand;