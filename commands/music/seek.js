import MusicCommand from "../../classes/musicCommand.js";

class SeekCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    if (!this.member?.voiceState) return "You need to be in a voice channel first!";
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return "I'm not in a voice channel!";
    if (!this.connection) return "Something odd happened to the voice connection; try playing your song again.";
    if (this.connection.host !== this.author.id) return "Only the current voice session host can seek the music!";
    const player = this.connection.player;
    const track = await player.node.rest.decode(player.track);
    if (!track?.info.isSeekable) return "This track isn't seekable!";
    const pos = this.options.position ?? this.args[0];
    let seconds;
    if (typeof pos === "string" && pos.includes(":")) {
      seconds = +(pos.split(":").reduce((acc, time) => (60 * acc) + +time));
    } else {
      seconds = Number.parseFloat(pos);
    }
    if (Number.isNaN(seconds) || (seconds * 1000) > track.info.length || (seconds * 1000) < 0) return "That's not a valid position!";
    player.seekTo(seconds * 1000);
    this.success = true;
    return `🔊 Seeked track to ${seconds} second(s).`;
  }

  static flags = [{
    name: "position",
    type: 3,
    description: "Seek to this position",
    required: true,
    classic: true
  }];
  static description = "Seeks to a different position in the music";
  static aliases = ["pos"];
}

export default SeekCommand;
