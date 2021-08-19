import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class ExplosionCommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/explosion.ogg", this.message);
  }

  static description = "Plays an explosion sound effect";
}

export default ExplosionCommand;