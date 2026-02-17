import MediaCommand from "#cmd-classes/mediaCommand.js";

class SlideCommand extends MediaCommand {
  paramsFunc() {
    const vertical = this.getOptionBoolean("vertical");
    const reverse = this.getOptionBoolean("reverse");
    return {
      vertical: !!vertical,
      reverse: !!reverse,
    };
  }

  static init() {
    super.init();
    this.flags.push(
      {
        name: "vertical",
        type: "boolean",
        description: "Slides the image vertically",
        classic: true,
      },
      {
        name: "reverse",
        type: "boolean",
        description: "Changes the direction the image slides in",
        classic: true,
      },
    );
    return this;
  }

  static description = "Slides an image in a direction";
  static aliases = ["shift"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to slide!";
  static command = "slide";
}

export default SlideCommand;
