import SoundboardCommand from "../../classes/soundboardCommand.js";

class FBICommand extends SoundboardCommand {
  static file = "./assets/audio/fbi.ogg";
  static description = "Plays the \"FBI OPEN UP\" sound effect";
  static aliases = ["openup"];
}

export default FBICommand;