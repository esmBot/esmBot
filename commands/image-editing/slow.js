const ImageCommand = require("../../classes/imageCommand.js");

class SlowCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  params = {
    slow: true
  };

  static description = "Makes an image sequence slower";
  static aliases = ["slowdown", "slower", "gifspeed2"];

  static requiresGIF = true;
  static noImage = "you need to provide an image to slow down!";
  static command = "speed";
}

module.exports = SlowCommand;