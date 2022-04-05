import SoundboardCommand from "../../classes/soundboardCommand.js";

class BoomCommand extends SoundboardCommand {
  static file = "./assets/audio/boom.ogg";
  static description = "Plays the Vine boom sound effect";
  static aliases = ["thud", "vine"];
}

export default BoomCommand;