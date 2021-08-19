import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class FartCommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/fart.ogg", this.message);
  }

  static description = "Plays a fart sound effect";
  static aliases = ["toot"];
}

export default FartCommand;