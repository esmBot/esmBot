import MusicCommand from "../../classes/musicCommand.js";

class ToggleCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    if (this.connection.host !== this.author.id && !this.memberPermissions.has("MANAGE_CHANNELS")) return this.getString("commands.responses.toggle.notHost");
    const player = this.connection.player;
    player.setPaused(!player.paused);
    this.success = true;
    return `🔊 ${this.getString(player.paused ? "commands.responses.toggle.paused" : "commands.responses.toggle.resumed")}`;
  }

  static description = "Pauses/resumes the current song";
  static aliases = ["pause", "resume"];
}

export default ToggleCommand;
