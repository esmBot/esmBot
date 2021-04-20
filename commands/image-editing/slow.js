const ImageCommand = require("../../classes/imageCommand");

class SlowCommand extends ImageCommand {
  params(args) {
    const speed = parseInt(args[0]);
    return {
      slow: true,
      speed: isNaN(speed) ? 2 : speed
    };
  }

  static description = "Makes an image sequence slower";
  static aliases = ["slowdown", "slower", "gifspeed2"];
  static arguments = ["{multiplier}"];

  static requiresGIF = true;
  static noImage = "you need to provide an image to slow down!";
  static command = "speed";
}

module.exports = SlowCommand;