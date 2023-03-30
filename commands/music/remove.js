import { queues } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class RemoveCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    if (!this.member.voiceState) return "You need to be in a voice channel first!";
    if (!this.guild.voiceStates.has(this.client.user.id)) return "I'm not in a voice channel!";
    if (!this.connection) return "Something odd happened to the voice connection; try playing your song again.";
    if (this.connection.host !== this.author.id && !process.env.OWNER.split(",").includes(this.connection.host)) return "Only the current voice session host can remove songs from the queue!";
    const pos = parseInt(this.options.position ?? this.args[0]);
    if (isNaN(pos) || pos > this.queue.length || pos < 1) return "That's not a valid position!";
    const removed = this.queue.splice(pos, 1);
    if (removed.length === 0) return "That's not a valid position!";
    const track = await this.connection.player.node.rest.decode(removed[0]);
    queues.set(this.guildID, this.queue);
    this.success = true;
    return `🔊 The song \`${track.title ? track.title : "(blank)"}\` has been removed from the queue.`;
  }

  static flags = [{
    name: "position",
    type: 4,
    description: "The queue position you want to remove",
    min_value: 1,
    required: true
  }];
  static description = "Removes a song from the queue";
  static aliases = ["rm"];
}

export default RemoveCommand;
