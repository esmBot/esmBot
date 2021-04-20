const SoundCommand = require("../../classes/soundCommand");

class BoomCommand extends SoundCommand {
  sound = "boom.ogg";
  static description = "Plays the Vine boom sound effect";
  static aliases = ["thud", "vine"];
}

module.exports = BoomCommand;