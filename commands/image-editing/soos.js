import ImageCommand from "../../classes/imageCommand.js";

class SooSCommand extends ImageCommand {
  params(url, delay) {
    return {
      delay: delay ? (100 / delay.split("/")[0]) * delay.split("/")[1] : 0,
      soos: true
    };
  }

  static description = "\"Loops\" an image sequence by reversing it when it's finished";
  static aliases = ["bounce", "boomerang"];

  static requiresGIF = true;
  static noImage = "You need to provide an image to loop!";
  static command = "reverse";
}

export default SooSCommand;
