import ImageCommand from "#cmd-classes/imageCommand.js";

class GameXplainCommand extends ImageCommand {
  static description = "Makes a GameXplain thumbnail from an image";
  static aliases = ["gx"];

  static noImage = "You need to provide an image/GIF to make a GameXplain thumbnail from!";
  static command = "gamexplain";
}

export default GameXplainCommand;
