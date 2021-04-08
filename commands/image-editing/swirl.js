const ImageCommand = require("../../classes/imageCommand.js");

class SwirlCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Swirls an image";
  static aliases = ["whirlpool"];

  static noImage = "you need to provide an image to swirl!";
  static command = "swirl";
}

module.exports = SwirlCommand;