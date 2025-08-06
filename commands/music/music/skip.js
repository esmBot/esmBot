import MusicCommand from "#cmd-classes/musicCommand.js";
import { skipVotes } from "#utils/soundplayer.js";

class MusicSkipCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    const player = this.connection;
    if (!player) return this.getString("sound.noConnection");
    if (player.host !== this.author.id && !this.memberPermissions.has("MANAGE_CHANNELS")) {
      const voiceChannel =
        this.client.getChannel(player.voiceChannel) ?? (await this.client.rest.channels.get(player.voiceChannel));
      if (!("voiceMembers" in voiceChannel)) throw Error("Voice member list not found");
      const votes = skipVotes.get(this.guild.id) ?? {
        count: 0,
        ids: [],
        max: Math.min(3, voiceChannel.voiceMembers.filter((i) => i.id !== this.client.user.id && !i.bot).length),
      };
      if (votes.ids.includes(this.author.id)) return this.getString("commands.responses.skip.alreadyVoted");
      const newObject = {
        count: votes.count + 1,
        ids: [...votes.ids, this.author.id].filter((item) => !!item),
        max: votes.max,
      };
      if (votes.count + 1 === votes.max) {
        await player.player.stopTrack();
        skipVotes.set(this.guild.id, {
          count: 0,
          ids: [],
          max: Math.min(3, voiceChannel.voiceMembers.filter((i) => i.id !== this.client.user.id && !i.bot).length),
        });
        this.success = true;
        if (this.type === "application") return `🔊 ${this.getString("commands.responses.skip.skipped")}`;
      } else {
        skipVotes.set(this.guild.id, newObject);
        this.success = true;
        return `🔊 ${this.getString("commands.responses.skip.voted", {
          params: {
            count: votes.count + 1,
            max: votes.max,
          },
        })}`;
      }
    } else {
      await player.player.stopTrack();
      this.success = true;
      if (this.type === "application") return `🔊 ${this.getString("commands.responses.skip.skipped")}`;
    }
  }

  static description = "Skips the current song";
  static aliases = ["skip", "forceskip", "s"];
}

export default MusicSkipCommand;
