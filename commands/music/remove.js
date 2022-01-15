import { Rest } from "lavacord";
import { queues } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class RemoveCommand extends MusicCommand {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    if (!this.message.member.voiceState.channelID) return "You need to be in a voice channel first!";
    if (!this.message.channel.guild.members.get(this.client.user.id).voiceState.channelID) return "I'm not in a voice channel!";
    if (this.connection.host !== this.message.author.id) return "Only the current voice session host can remove songs from the queue!";
    const pos = parseInt(this.args[0]);
    if (isNaN(pos) || pos > this.queue.length || pos < 1) return "That's not a valid position!";
    const removed = this.queue.splice(pos, 1);
    const track = await Rest.decode(this.connection.player.node, removed[0]);
    queues.set(this.message.channel.guild.id, this.queue);
    return `🔊 The song \`${track.title ? track.title : "(blank)"}\` has been removed from the queue.`;
  }

  static description = "Removes a song from the queue";
  static aliases = ["rm"];
}

export default RemoveCommand;
