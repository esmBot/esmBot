import { queues } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class RemoveCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    if (this.connection.host !== this.author.id && !process.env.OWNER.split(",").includes(this.connection.host)) return this.getString("commands.responses.remove.notHost");
    const pos = this.getOptionInteger("position") ?? Number.parseInt(this.args[0]);
    if (Number.isNaN(pos) || pos > this.queue.length || pos < 1) return this.getString("commands.responses.remove.invalidPosition");
    const removed = this.queue.splice(pos, 1);
    if (removed.length === 0) return this.getString("commands.responses.remove.invalidPosition");
    const track = await this.connection.player.node.rest.decode(removed[0]);
    queues.set(this.guild.id, this.queue);
    this.success = true;
    return `🔊 ${this.getString("commands.responses.remove.removed", { params: { song: track?.info.title ? track.info.title : this.getString("sound.blank") } })}`;
  }

  static flags = [{
    name: "position",
    type: 4,
    description: "The queue position you want to remove",
    minValue: 1,
    required: true,
    classic: true
  }];
  static description = "Removes a song from the queue";
  static aliases = ["rm"];
}

export default RemoveCommand;
