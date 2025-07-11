import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class SnapchatCommand extends ImageCommand {
  /**
   * @param {string | undefined} url
   */
  paramsFunc(url) {
    const newArgs = this.getOptionString("text") ?? this.args.filter((item) => !item.includes(url ?? "")).join(" ");
    const position = this.getOptionNumber("position");
    return {
      caption: this.clean(newArgs),
      pos: position == null || Number.isNaN(position) ? 0.565 : position,
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    this.flags.push({
      name: "position",
      type: Constants.ApplicationCommandOptionTypes.NUMBER,
      description: "Set the position of the caption as a decimal (0.0 is top, 1.0 is bottom, default is 0.565)",
      minValue: 0,
      maxValue: 1,
    });
    return this;
  }

  static description = "Adds a Snapchat style caption to an image";
  static aliases = ["snap", "caption3"];

  static requiresParam = true;
  static noParam = "You need to provide some text to add a caption!";
  static noImage = "You need to provide an image/GIF to add a caption!";
  static command = "snapchat";
}

export default SnapchatCommand;
