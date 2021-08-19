import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class OofCommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/oof.ogg", this.message);
  }

  static description = "Plays the Roblox \"oof\" sound";
  static aliases = ["roblox", "commitdie"];
}

export default OofCommand;