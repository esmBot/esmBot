const ImageCommand = require("../../classes/imageCommand.js");

class GameXplainCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Makes a GameXplain thumbnail from an image";
  static aliases = ["gx"];

  static noImage = "you need to provide an image to make a GameXplain thumbnail from!";
  static command = "gamexplain";
}

module.exports = GameXplainCommand;