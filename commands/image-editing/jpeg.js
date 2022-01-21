import ImageCommand from "../../classes/imageCommand.js";

class JPEGCommand extends ImageCommand {
  params() {
    const quality = parseInt(this.args[0]);
    return {
      quality: isNaN(quality) ? 1 : Math.max(1, Math.min(quality, 100))
    };
  }

  static description = "Adds JPEG compression to an image";
  static aliases = ["needsmorejpeg", "jpegify", "magik2", "morejpeg", "jpg", "quality"];
  static arguments = ["{quality}"];

  static noImage = "You need to provide an image to add more JPEG!";
  static command = "jpeg";
}

export default JPEGCommand;
