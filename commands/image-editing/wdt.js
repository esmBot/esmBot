const ImageCommand = require("../../classes/imageCommand");

class WhoDidThisCommand extends ImageCommand {
  static description = "Creates a \"WHO DID THIS\" meme from an image";
  static aliases = ["whodidthis"];

  static noImage = "you need to provide an image to make a \"who did this\" meme!";
  static command = "wdt";
}

module.exports = WhoDidThisCommand;