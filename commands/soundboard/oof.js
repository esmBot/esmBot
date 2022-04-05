import SoundboardCommand from "../../classes/soundboardCommand.js";

class OofCommand extends SoundboardCommand {
  static file = "./assets/audio/oof.ogg";
  static description = "Plays the Roblox \"oof\" sound";
  static aliases = ["roblox", "commitdie"];
}

export default OofCommand;