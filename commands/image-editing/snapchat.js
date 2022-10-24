import ImageCommand from "../../classes/imageCommand.js";
import { cleanMessage } from "../../utils/misc.js";

class SnapchatCommand extends ImageCommand {
  params(url) {
    const newArgs = this.options.text ?? this.args.filter(item => !item.includes(url)).join(" ");
    const position = parseFloat(this.options.position);
    return {
      caption: cleanMessage(this.message ?? this.interaction, newArgs),
      pos: isNaN(position) ? 0.5 : position
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "position",
      type: 10,
      description: "Set the position of the caption as a decimal (0.0 is top, 1.0 is bottom, default is 0.5)",
      min_value: 0,
      max_value: 1
    });
    return this;
  }

  static description = "Adds a Snapchat style caption to an image";
  static aliases = ["snap", "caption3"];
  static arguments = ["[text]"];

  static requiresText = true;
  static noText = "You need to provide some text to add a caption!";
  static noImage = "You need to provide an image/GIF to add a caption!";
  static command = "snapchat";
}

export default SnapchatCommand;
