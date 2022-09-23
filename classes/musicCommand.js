import Command from "./command.js";
import { players, queues } from "../utils/soundplayer.js";

class MusicCommand extends Command {
  constructor(client, options) {
    super(client, options);
    if (this.channel.guild) {
      this.connection = players.get(this.channel.guild.id);
      this.queue = queues.get(this.channel.guild.id);
    }
  }

  static requires = ["sound"];
  static slashAllowed = false;
  static directAllowed = false;
}

export default MusicCommand;
