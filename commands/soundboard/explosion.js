const SoundCommand = require("../../classes/soundCommand");

class ExplosionCommand extends SoundCommand {
  sound = "explosion.ogg";

  static description = "Plays an explosion sound effect";
}

module.exports = ExplosionCommand;