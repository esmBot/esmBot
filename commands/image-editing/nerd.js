import ImageCommand from "../../classes/imageCommand.js";

class NerdCommand extends ImageCommand {
  static description = "Makes nerd say an image";
  static aliases = ["says"];

  static noImage = "You need to provide an image/GIF for nerd to say!";
  static command = "nerd";
}

export default NerdCommand;
