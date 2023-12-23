import ImageCommand from "../../classes/imageCommand.js";

class JPEGCommand extends ImageCommand {
  params() {
    const quality = parseInt(this.options.quality ?? this.args[0]);
    return {
      quality: isNaN(quality) ? 1 : Math.max(1, Math.min(quality, 100))
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "quality",
      type: 4,
      description: "Set the JPEG quality (default: 1)",
      min_value: 1,
      max_value: 100
    });
    return this;
  }

  static description = "Adds JPEG compression to an image";
  static aliases = ["needsmorejpeg", "jpegify", "magik2", "morejpeg", "jpg", "quality"];
  static args = ["{quality}"];

  static noImage = "You need to provide an image/GIF to add more JPEG!";
  static command = "jpeg";
}

export default JPEGCommand;
