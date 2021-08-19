import ImageCommand from "../../classes/imageCommand.js";

class GameXplainCommand extends ImageCommand {
  static description = "Makes a GameXplain thumbnail from an image";
  static aliases = ["gx"];

  static noImage = "You need to provide an image to make a GameXplain thumbnail from!";
  static command = "gamexplain";
}

export default GameXplainCommand;