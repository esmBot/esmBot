import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class BoiCommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/boi.ogg", this.message);
  }

  static description = "Plays the \"boi\" sound effect";
  static aliases = ["boy", "neutron", "hugh"];
}

export default BoiCommand;