import MusicCommand from "../../classes/musicCommand.js";

class VolumeCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    if (!this.member?.voiceState) return "You need to be in a voice channel first!";
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return "I'm not in a voice channel!";
    if (!this.connection) return "Something odd happened to the voice connection; try playing your song again.";
    if (this.connection.host !== this.author.id && !this.memberPermissions.has("MANAGE_CHANNELS")) return "Only the current voice session host can change the volume!";
    const vol = Number.parseInt(this.options.level ?? this.args[0]);
    if (Number.isNaN(vol) || vol > 100 || vol < 0) return "You can only set the volume between 0 and 100!";
    await this.connection.player.setGlobalVolume(vol);
    this.success = true;
    return `🔊 The volume has been changed to \`${vol}\`.`;
  }

  static flags = [{
    name: "level",
    type: 4,
    description: "The volume level",
    min_value: 0,
    max_value: 100,
    required: true,
    classic: true
  }];
  static description = "Sets the volume of the music";
  static aliases = ["vol", "level"];
}

export default VolumeCommand;
