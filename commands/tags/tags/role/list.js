import Command from "#cmd-classes/command.js";
import paginator from "#pagination";

class TagsRoleListCommand extends Command {
  async run() {
    this.success = false;
    if (!this.database) return this.getString("noDatabase");
    if (!this.guild) return this.getString("guildOnly");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const guild = await this.database.getGuild(this.guild.id);
    const embeds = [];
    const groups = [];
    let arrIndex = 0;
    const roleMentions = guild.tag_roles.map((v) => `<@&${v}>`);
    for (let i = 0; i < roleMentions.length; i += 15) {
      groups[arrIndex] = roleMentions.slice(i, i + 15);
      arrIndex++;
    }
    for (const [i, value] of groups.entries()) {
      embeds.push({
        embeds: [
          {
            title: this.getString("commands.responses.tags.roleList"),
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
    if (embeds.length === 0) return this.getString("commands.responses.tags.noRoles");
    this.success = true;
    return paginator(
      this.client,
      { message: this.message, interaction: this.interaction, author: this.author },
      embeds,
    );
  }

  static description = "List the roles that are capable of managing tags";
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsRoleListCommand;
