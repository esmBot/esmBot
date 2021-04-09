const ImageCommand = require("../../classes/imageCommand.js");

class SpeedCommand extends ImageCommand {
  static description = "Makes an image sequence faster";
  static aliases = ["speedup", "fast", "gifspeed", "faster"];

  static requiresGIF = true;
  static noImage = "you need to provide an image to speed up!";
  static command = "speed";
}

module.exports = SpeedCommand;