import Command from "#cmd-classes/command.js";
import paginator from "#pagination";

class TagsListCommand extends Command {
  async run() {
    if (!this.database) return this.getString("noDatabase");
    if (!this.guild) return this.getString("guildOnly");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const tagList = await this.database.getTags(this.guild.id);
    const embeds = [];
    const groups = [];
    let arrIndex = 0;
    const keys = Object.keys(tagList);
    for (let i = 0; i < keys.length; i += 15) {
      groups[arrIndex] = keys.slice(i, i + 15);
      arrIndex++;
    }
    for (const [i, value] of groups.entries()) {
      embeds.push({
        embeds: [
          {
            title: this.getString("commands.responses.tags.list"),
            color: 0xff0000,
            footer: {
              text: this.getString("pagination.page", {
                params: {
                  page: (i + 1).toString(),
                  amount: groups.length.toString(),
                },
              }),
            },
            description: value?.join("\n"),
            author: {
              name: this.author.username,
              iconURL: this.author.avatarURL(),
            },
          },
        ],
      });
    }
    if (embeds.length === 0) return this.getString("commands.responses.tags.noTags");
    this.success = true;
    return paginator(
      this.client,
      { message: this.message, interaction: this.interaction, author: this.author },
      embeds,
    );
  }

  static description = "Lists every tag in this server";
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsListCommand;
