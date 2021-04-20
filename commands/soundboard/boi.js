const SoundCommand = require("../../classes/soundCommand");

class BoiCommand extends SoundCommand {
  sound = "boi.ogg";
  static description = "Plays the \"boi\" sound effect";
  static aliases = ["boy", "neutron", "hugh"];
}

module.exports = BoiCommand;