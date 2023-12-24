import MusicCommand from "#cmd-classes/musicCommand.js";

class SeekCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
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
