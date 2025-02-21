import type { Client } from "oceanic.js";
import { type SoundPlayer, players, queues } from "#utils/soundplayer.js";
import Command, { type CommandOptions } from "./command.js";

class MusicCommand extends Command {
  connection?: SoundPlayer;
  queue?: string[];
  constructor(client: Client, options: CommandOptions) {
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
