import { skipVotes } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class SkipCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return "I'm not in a voice channel!";
    const player = this.connection;
    if (!player) return "Something odd happened to the voice connection; try playing your song again.";
    if (player.host !== this.author.id && !this.memberPermissions.has("MANAGE_CHANNELS")) {
      const votes = skipVotes.get(this.guild.id) ?? { count: 0, ids: [], max: Math.min(3, player.voiceChannel.voiceMembers.filter((i) => i.id !== this.client.user.id && !i.bot).length) };
      if (votes.ids.includes(this.author.id)) return "You've already voted to skip!";
      const newObject = {
        count: votes.count + 1,
        ids: [...votes.ids, this.author.id].filter(item => !!item),
        max: votes.max
      };
      if (votes.count + 1 === votes.max) {
        await player.player.stopTrack();
        skipVotes.set(this.guild.id, { count: 0, ids: [], max: Math.min(3, player.voiceChannel.voiceMembers.filter((i) => i.id !== this.client.user.id && !i.bot).length) });
        this.success = true;
        if (this.type === "application") return "🔊 The current song has been skipped.";
      } else {
        skipVotes.set(this.guild.id, newObject);
        this.success = true;
        return `🔊 Voted to skip song (${votes.count + 1}/${votes.max} people have voted).`;
      }
    } else {
      await player.player.stopTrack();
      this.success = true;
      if (this.type === "application") return "🔊 The current song has been skipped.";
    }
  }

  static description = "Skips the current song";
  static aliases = ["forceskip", "s"];
}

export default SkipCommand;
