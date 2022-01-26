import ImageCommand from "../../classes/imageCommand.js";

class WhoDidThisCommand extends ImageCommand {
  static description = "Creates a \"WHO DID THIS\" meme from an image";
  static aliases = ["whodidthis"];

  static noImage = "You need to provide an image/GIF to make a \"who did this\" meme!";
  static command = "wdt";
}

export default WhoDidThisCommand;
