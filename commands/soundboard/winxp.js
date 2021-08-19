import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class WinXPCommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/winxp.ogg", this.message);
  }

  static description = "Plays the Windows XP startup sound";
  static aliases = ["windows", "xp"];
}

export default WinXPCommand;