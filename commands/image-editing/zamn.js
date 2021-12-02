import ImageCommand from "../../classes/imageCommand.js";

class ZamnCommand extends ImageCommand {
  static description = "ZAMN! SHES 12?";

  static noImage = "You need to provide an image to zamn at!";
  static command = "zamn";
}

export default ZamnCommand;