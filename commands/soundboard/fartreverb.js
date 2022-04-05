import SoundboardCommand from "../../classes/soundboardCommand.js";

class FartReverbCommand extends SoundboardCommand {
  static file = "./assets/audio/fart2.ogg";
  static description = "Plays a fart sound effect with extra reverb";
  static aliases = ["fart2"];
}

export default FartReverbCommand;