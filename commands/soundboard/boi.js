import SoundboardCommand from "../../classes/soundboardCommand.js";

class BoiCommand extends SoundboardCommand {
  static file = "./assets/audio/boi.ogg";
  static description = "Plays the \"boi\" sound effect";
  static aliases = ["boy", "neutron", "hugh"];
}

export default BoiCommand;