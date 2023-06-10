import ImageCommand from "../../classes/imageCommand.js";
import { cleanMessage } from "../../utils/misc.js";

class SpotifyCommand extends ImageCommand {
  params(url) {
    const newArgs = this.options.text ?? this.args.filter(item => !item.includes(url)).join(" ");
    return {
      caption: cleanMessage(this.message ?? this.interaction, newArgs),
    };
  }

  static description = "Adds a Spotify \"This is\" header to an image";
  static arguments = ["[name]"];

  static requiresText = true;
  static noText = "You need to provide some text to add a Spotify \"This is\" header!";
  static noImage = "You need to provide an image/GIF to add a Spotify \"This is\" header!";
  static command = "spotify";
}

export default SpotifyCommand;
