const ImageCommand = require("../../classes/imageCommand");

class StretchCommand extends ImageCommand {
  params = {
    stretch: true
  };

  static description = "Stretches an image to a 4:3 aspect ratio";
  static aliases = ["aspect", "ratio", "aspect43", "43"];

  static noImage = "you need to provide an image to stretch!";
  static command = "resize";
}

module.exports = StretchCommand;