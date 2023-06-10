import ImageCommand from "../../classes/imageCommand.js";
import { cleanMessage } from "../../utils/misc.js";

class SpotifyCommand extends ImageCommand {
  params(url) {
    const newArgs = this.options.text ?? this.args.filter(item => !item.includes(url)).join(" ");
    let newCaption = cleanMessage(this.message ?? this.interaction, newArgs);
    return {
      caption: newCaption.toUpperCase(),
    };
  }

  static description = "Create a spotify \"This is\" message with your image and inputted name.";
  static arguments = ["{name}"];

  static noText = "You need to provide some text to add a Spotify \"This is\"!";
  static command = "spotify";
}

export default SpotifyCommand;
