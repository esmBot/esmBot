import ImageCommand from "../../classes/imageCommand.js";

class SpeechBubbleCommand extends ImageCommand {
  params() {
    return {
      water: this.specialArgs.alpha ? "assets/images/speech.png" : "assets/images/speechbubble.png",
      gravity: "north",
      resize: true,
      yscale: 0.2,
      alpha: this.specialArgs.alpha,
      flip: this.specialArgs.flip
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "alpha",
      description: "Make the top of the speech bubble transparent",
      type: 5
    }, {
      name: "flip",
      description: "Flips the speech bubble",
      type: 5
    });
    return this;
  }

  static description = "Adds a speech bubble to an image";
  static aliases = ["speech"];

  static noImage = "You need to provide an image/GIF to add a speech bubble!";
  static command = "watermark";
}

export default SpeechBubbleCommand;
