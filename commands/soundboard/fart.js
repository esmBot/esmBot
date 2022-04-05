import SoundboardCommand from "../../classes/soundboardCommand.js";

class FartCommand extends SoundboardCommand {
  static file = "./assets/audio/fart.ogg";
  static description = "Plays a fart sound effect";
  static aliases = ["toot"];
}

export default FartCommand;