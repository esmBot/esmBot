const SoundCommand = require("../../classes/soundCommand");

class BruhCommand extends SoundCommand {
  sound = "bruh.ogg";
  static description = "Plays the \"bruh\" sound effect";
  static aliases = ["bro"];
}

module.exports = BruhCommand;