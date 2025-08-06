import { Constants } from "oceanic.js";
import MusicCommand from "#cmd-classes/musicCommand.js";

class MusicVolumeCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    if (this.connection.host !== this.author.id && !this.memberPermissions.has("MANAGE_CHANNELS"))
      return "Only the current voice session host can change the volume!";
    const vol = this.getOptionInteger("level", true) ?? Number.parseInt(this.args[0]);
    if (Number.isNaN(vol) || vol > 100 || vol < 0) return "You can only set the volume between 0 and 100!";
    await this.connection.player.setGlobalVolume(vol);
    this.success = true;
    return `🔊 The volume has been changed to \`${vol}\`.`;
  }

  static flags = [
    {
      name: "level",
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      description: "The volume level",
      minValue: 0,
      maxValue: 100,
      required: true,
      classic: true,
    },
  ];
  static description = "Sets the volume of the music";
  static aliases = ["volume", "vol", "level"];
}

export default MusicVolumeCommand;
