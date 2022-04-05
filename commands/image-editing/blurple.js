import ImageCommand from "../../classes/imageCommand.js";

class BlurpleCommand extends ImageCommand {
  params() {
    return {
      old: !!this.specialArgs.old,
      color: "blurple"
    };
  }
  
  static description = "Turns an image blurple";

  static init() {
    super.init();
    this.flags.push({
      name: "old",
      description: "Use the old blurple color",
      type: 5
    });
    return this;
  }

  static noImage = "You need to provide an image/GIF to make blurple!";
  static command = "colors";
  static aliases = ["blurp"];
}

export default BlurpleCommand;
