const ImageCommand = require("../../classes/imageCommand.js");

class WhoDidThisCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Creates a \"WHO DID THIS\" meme from an image";
  static aliases = ["whodidthis"];

  static noImage = "you need to provide an image to make a \"who did this\" meme!";
  static command = "wdt";
}

module.exports = WhoDidThisCommand;