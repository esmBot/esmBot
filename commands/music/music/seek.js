import { Constants } from "oceanic.js";
import MusicCommand from "#cmd-classes/musicCommand.js";

class MusicSeekCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    if (this.connection.host !== this.author.id) return this.getString("commands.responses.seek.notHost");
    const player = this.connection.player;
    if (!player || !player.track) return this.getString("sound.notPlaying");
    const track = await player.node.rest.decode(player.track);
    if (!track?.info.isSeekable) return this.getString("commands.responses.seek.notSeekable");
    const pos = this.getOptionString("position") ?? this.args[0];
    let seconds;
    if (typeof pos === "string" && pos.includes(":")) {
      seconds = +pos.split(":").reduce((acc, time) => (60 * Number(acc) + +Number(time)).toString());
    } else {
      seconds = Number.parseFloat(pos);
    }
    if (Number.isNaN(seconds) || seconds * 1000 > track.info.length || seconds * 1000 < 0)
      return this.getString("commands.responses.seek.invalidPosition");
    player.seekTo(seconds * 1000);
    this.success = true;
    return `🔊 ${this.getString("commands.responses.seek.seeked", { params: { seconds: seconds.toString() } })}`;
  }

  static flags = [
    {
      name: "position",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "Seek to this position",
      required: true,
      classic: true,
    },
  ];
  static description = "Seeks to a different position in the music";
  static aliases = ["seek", "pos"];
}

export default MusicSeekCommand;
