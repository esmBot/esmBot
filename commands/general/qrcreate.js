import ImageCommand from "../../classes/imageCommand.js";
import { cleanMessage } from "../../utils/misc.js";

class QrCreateCommand extends ImageCommand {
  params() {
    const cleanedMessage = cleanMessage(this.message ?? this.interaction, this.options.text ?? this.args.join(" "));
    return {
      text: cleanedMessage
    };
  }

  static description = "Generates a QR code";

  static requiresImage = false;
  static requiresText = true;
  static noText = "You need to provide some text to generate a QR code!";
  static command = "qrcreate";
}

export default QrCreateCommand;