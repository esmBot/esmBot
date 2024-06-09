import ImageCommand from "../../classes/imageCommand.js";

class BounceCommand extends ImageCommand {
  static description = "Makes an image bounce up and down";
  static aliases = ["bouncy"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to bounce!";
  static command = "bounce";
}

export default BounceCommand;
