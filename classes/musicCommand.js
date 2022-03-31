import Command from "./command.js";
import { players, queues } from "../utils/soundplayer.js";

class MusicCommand extends Command {
  constructor(client, cluster, worker, ipc, options) {
    super(client, cluster, worker, ipc, options);
    this.connection = players.get(options.message.channel.guild.id);
    this.queue = queues.get(options.message.channel.guild.id);
  }

  static requires = ["sound"];
}

export default MusicCommand;