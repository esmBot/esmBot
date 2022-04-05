import SoundboardCommand from "../../classes/soundboardCommand.js";

class ExplosionCommand extends SoundboardCommand {
  static file = "./assets/audio/explosion.ogg";
  static description = "Plays an explosion sound effect";
}

export default ExplosionCommand;