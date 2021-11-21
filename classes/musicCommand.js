import Command from "./command.js";
import { players, queues } from "../utils/soundplayer.js";

class MusicCommand extends Command {
  constructor(client, cluster, worker, ipc, message, args, content, specialArgs) {
    super(client, cluster, worker, ipc, message, args, content, specialArgs);
    this.connection = players.get(message.channel.guild.id);
    this.queue = queues.get(message.channel.guild.id);
  }

  static requires = ["sound"];
}

export default MusicCommand;