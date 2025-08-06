import { Constants, GuildChannel } from "oceanic.js";
import MusicCommand from "#cmd-classes/musicCommand.js";
import { play } from "#utils/soundplayer.js";
const prefixes = ["scsearch:", "spsearch:", "sprec:", "amsearch:", "dzsearch:", "dzisrc:", "ytsearch:", "ytmsearch:"];

class MusicPlayCommand extends MusicCommand {
  async run() {
    if (!this.guild || !this.member || !(this.channel instanceof GuildChannel)) {
      this.success = false;
      return this.getString("guildOnly");
    }
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
    const input = this.getOptionString("query") ?? this.args.join(" ");
    if (!input && (!this.message || this.message?.attachments.size <= 0)) {
      this.success = false;
      return this.getString("commands.responses.play.noInput");
    }
    let query = input ? input.trim() : "";
    const attachment = this.type === "classic" ? this.message?.attachments.first() : undefined;
    if (query.startsWith("||") && query.endsWith("||")) {
      query = query.substring(2, query.length - 2);
    }
    if (query.startsWith("<") && query.endsWith(">")) {
      query = query.substring(1, query.length - 1);
    }
    try {
      const url = new URL(query);
      return play(this.client, url.toString(), {
        channel: this.channel,
        guild: this.guild,
        member: this.member,
        type: this.type,
        interaction: this.interaction,
        locale: this.locale,
      });
    } catch {
      const search = prefixes.some((v) => query.startsWith(v))
        ? query
        : !query && attachment
          ? attachment.url
          : `ytsearch:${query}`;
      return play(this.client, search, {
        channel: this.channel,
        guild: this.guild,
        member: this.member,
        type: this.type,
        interaction: this.interaction,
        locale: this.locale,
      });
    }
  }

  static flags = [
    {
      name: "query",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "An audio search query or URL",
      classic: true,
      required: true,
    },
  ];
  static description = "Plays a song or adds it to the queue";
  static aliases = ["play", "p"];
}

export default MusicPlayCommand;
