import ImageCommand from "../../classes/imageCommand.js";

class ZamnCommand extends ImageCommand {
  static description = "Adds a \"ZAMN\" reaction to an image";

  static noImage = "You need to provide an image to \"ZAMN\" at!";
  static command = "zamn";
}

export default ZamnCommand;