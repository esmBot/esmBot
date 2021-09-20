// shoutouts to dairyorange, you're a real one
import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class FartReverbCommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/fart2.ogg", this.message);
  }

  static description = "Plays a fart sound effect with extra reverb";
  static aliases = ["fart2"];
}

export default FartReverbCommand;