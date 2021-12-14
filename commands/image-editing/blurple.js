import ImageCommand from "../../classes/imageCommand.js";

class BlurpleCommand extends ImageCommand {
  params() {
    return {
      old: !!this.specialArgs.old,
      color: "blurple"
    };
  }
  
  static description = "Turns an image blurple";
  static flags = [{
    name: "old",
    description: "Use the old blurple color"
  }];

  static noImage = "You need to provide an image to make blurple!";
  static command = "colors";
  static aliases = ["blurp"];
}

export default BlurpleCommand;
