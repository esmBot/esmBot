import { Rest } from "lavacord";
import MusicCommand from "../../classes/musicCommand.js";

class SeekCommand extends MusicCommand {
  async run() {
    if (!this.channel.guild) return "This command only works in servers!";
    if (!this.member.voiceState.channelID) return "You need to be in a voice channel first!";
    if (!this.channel.guild.members.get(this.client.user.id).voiceState.channelID) return "I'm not in a voice channel!";
    if (this.connection.host !== this.author.id) return "Only the current voice session host can seek the music!";
    const player = this.connection.player;
    const track = await Rest.decode(player.node, player.track);
    if (!track.isSeekable) return "This track isn't seekable!";
    const seconds = parseFloat(this.type === "classic" ? this.args[0] : this.options.position);
    if (isNaN(seconds) || (seconds * 1000) > track.length || (seconds * 1000) < 0) return "That's not a valid position!";
    await player.seek(seconds * 1000);
    return `🔊 Seeked track to ${seconds} second(s).`;
  }

  static flags = [{
    name: "position",
    type: 10,
    description: "Seek to this position",
    required: true,
    min_value: 0
  }];
  static description = "Seeks to a different position in the music";
  static aliases = ["pos"];
  static arguments = ["[seconds]"];
}

export default SeekCommand;
