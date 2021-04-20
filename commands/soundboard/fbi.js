const SoundCommand = require("../../classes/soundCommand");

class FBICommand extends SoundCommand {
  sound = "fbi.ogg";

  static description = "Plays the \"FBI OPEN UP\" sound effect";
  static aliases = ["openup"];
}

module.exports = FBICommand;