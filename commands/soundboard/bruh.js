import SoundboardCommand from "../../classes/soundboardCommand.js";

class BruhCommand extends SoundboardCommand {
  static file = "./assets/audio/bruh.ogg";
  static description = "Plays the \"bruh\" sound effect";
  static aliases = ["bro"];
}

export default BruhCommand;