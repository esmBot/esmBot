import ImageCommand from "#cmd-classes/imageCommand.js";

class SlideCommand extends ImageCommand {
  paramsFunc() {
    const vertical = this.getOptionBoolean("vertical");
    const reverse = this.getOptionBoolean("reverse");
    return {
      vertical: !!vertical,
      reverse: !!reverse,
    };
  }

  static description = "Slides an image in a direction";
  static aliases = ["shift"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to slide!";
  static command = "slide";
}

export default SlideCommand;
