const ImageCommand = require("../../classes/imageCommand.js");

class ScottCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Makes Scott the Woz show off an image";
  static aliases = ["woz", "tv", "porn"];

  static noImage = "you need to provide an image for Scott to show off!";
  static command = "scott";
}

module.exports = ScottCommand;