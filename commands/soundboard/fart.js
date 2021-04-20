const SoundCommand = require("../../classes/soundCommand");

class FartCommand extends SoundCommand {
  sound = "fart.ogg";

  static description = "Plays a fart sound effect";
  static aliases = ["toot"];
}

module.exports = FartCommand;