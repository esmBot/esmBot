const SoundCommand = require("../../classes/soundCommand");

class OofCommand extends SoundCommand {
  sound = "oof.ogg";

  static description = "Plays the Roblox \"oof\" sound";
  static aliases = ["roblox", "commitdie"];
}

module.exports = OofCommand;