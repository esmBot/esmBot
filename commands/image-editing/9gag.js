const ImageCommand = require("../../classes/imageCommand.js");

class NineGagCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  params = {
    water: "./assets/images/9gag.png",
    gravity: 6
  };

  static description = "Adds the 9GAG watermark to an image";
  static aliases = ["ninegag", "gag"];

  static noImage = "you need to provide an image to add a 9GAG watermark!";
  static command = "watermark";
}

module.exports = NineGagCommand;