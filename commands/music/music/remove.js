import process from "node:process";
import { Constants } from "oceanic.js";
import MusicCommand from "#cmd-classes/musicCommand.js";
import { queues } from "#utils/soundplayer.js";

class MusicRemoveCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    const owners = process.env.OWNER?.split(",") ?? [];
    if (this.connection.host !== this.author.id && !owners.includes(this.connection.host))
      return this.getString("commands.responses.remove.notHost");
    const pos = this.getOptionInteger("position", true) ?? Number.parseInt(this.args[0]);
    if (Number.isNaN(pos) || pos > this.queue.length || pos < 1)
      return this.getString("commands.responses.remove.invalidPosition");
    const removed = this.queue.splice(pos, 1);
    if (removed.length === 0) return this.getString("commands.responses.remove.invalidPosition");
    queues.set(this.guild.id, this.queue);
    this.success = true;
    return `🔊 ${this.getString("commands.responses.remove.removed", { params: { song: removed[0].info.title ? removed[0].info.title : this.getString("sound.blank") } })}`;
  }

  static flags = [
    {
      name: "position",
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      description: "The queue position you want to remove",
      minValue: 1,
      required: true,
      classic: true,
    },
  ];
  static description = "Removes a song from the queue";
  static aliases = ["remove", "rm"];
}

export default MusicRemoveCommand;
