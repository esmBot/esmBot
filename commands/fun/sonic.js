import ImageCommand from "../../classes/imageCommand.js";
import { cleanMessage } from "../../utils/misc.js";

class SonicCommand extends ImageCommand {
  params() {
    const cleanedMessage = cleanMessage(this.message ?? this.interaction, this.options.text ?? this.args.join(" "));
    return {
      text: cleanedMessage
    };
  }

  static description = "Creates a Sonic speech bubble image";

  static requiresImage = false;
  static requiresText = true;
  static noText = "You need to provide some text to make a Sonic meme!";
  static command = "sonic";
}

export default SonicCommand;