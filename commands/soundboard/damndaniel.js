import SoundboardCommand from "../../classes/soundboardCommand.js";

class DamnDanielCommand extends SoundboardCommand {
  static file = "./assets/audio/damndaniel.ogg";
  static description = "Plays the \"damn daniel\" sound effect";
  static aliases = ["daniel", "damn"];
}

export default DamnDanielCommand;
