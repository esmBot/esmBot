import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class FakePingCommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/ping.ogg", this.message);
  }

  static description = "Plays a Discord ping sound effect";
  static aliases = ["notification", "notif"];
}

export default FakePingCommand;