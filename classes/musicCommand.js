import Command from "./command.js";
import { players, queues } from "../utils/soundplayer.js";

class MusicCommand extends Command {
  constructor(client, options) {
    super(client, options);
    if (this.guild) {
      this.connection = players.get(this.guild.id);
      this.queue = queues.get(this.guild.id);
    }
  }

  static slashAllowed = false;
  static directAllowed = false;
  static userAllowed = false;
}

export default MusicCommand;
