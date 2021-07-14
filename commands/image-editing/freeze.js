const ImageCommand = require("../../classes/imageCommand.js");

class FreezeCommand extends ImageCommand {
  params() {
    const frameCount = parseInt(this.args[0]);
    return {
      loop: false,
      frame: isNaN(frameCount) ? -1 : frameCount
    };
  }

  static description = "Makes an image sequence only play once";
  static aliases = ["noloop", "once"];
  static arguments = ["{end frame number}"];

  static requiresGIF = true;
  static noImage = "You need to provide an image to freeze!";
  static command = "freeze";
}

module.exports = FreezeCommand;