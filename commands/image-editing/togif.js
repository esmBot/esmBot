import ImageCommand from "../../classes/imageCommand.js";

class ToGIFCommand extends ImageCommand {
  static description = "Turns an image into a gif";
  static aliases = ["tgif", "gifify"];

  static noImage = "You need to provide an image to turn into a GIF!";
  static command = "togif";
}

export default ToGIFCommand;
