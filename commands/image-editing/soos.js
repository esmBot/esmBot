const ImageCommand = require("../../classes/imageCommand");

class SooSCommand extends ImageCommand {
  params(args, url, delay) {
    return {
      delay: delay ? (100 / delay.split("/")[0]) * delay.split("/")[1] : 0,
      soos: true
    };
  }

  static description = "\"Loops\" an image sequence by reversing it when it's finished";
  static aliases = ["bounce"];

  static requiresGIF = true;
  static noImage = "you need to provide an image to loop!";
  static command = "reverse";
}

module.exports = SooSCommand;