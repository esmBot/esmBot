import ImageCommand from "../../classes/imageCommand.js";

class SwirlCommand extends ImageCommand {
  static description = "Swirls an image";
  static aliases = ["whirlpool"];

  static noImage = "You need to provide an image to swirl!";
  static command = "swirl";
}

export default SwirlCommand;