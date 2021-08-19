import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class BoomCommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/boom.ogg", this.message);
  }

  static description = "Plays the Vine boom sound effect";
  static aliases = ["thud", "vine"];
}

export default BoomCommand;