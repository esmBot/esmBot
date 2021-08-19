import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class BruhCommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/bruh.ogg", this.message);
  }

  static description = "Plays the \"bruh\" sound effect";
  static aliases = ["bro"];
}

export default BruhCommand;