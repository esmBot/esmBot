import MusicCommand from "../../classes/musicCommand.js";

class ToggleCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    if (this.connection.host !== this.author.id && !this.memberPermissions.has("MANAGE_CHANNELS")) return "Only the current voice session host can pause/resume the music!";
    const player = this.connection.player;
    player.setPaused(!player.paused);
    this.success = true;
    return `🔊 The player has been ${player.paused ? "paused" : "resumed"}.`;
  }

  static description = "Pauses/resumes the current song";
  static aliases = ["pause", "resume"];
}

export default ToggleCommand;
