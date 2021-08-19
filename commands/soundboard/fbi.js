import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class FBICommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/fbi.ogg", this.message);
  }

  static description = "Plays the \"FBI OPEN UP\" sound effect";
  static aliases = ["openup"];
}

export default FBICommand;