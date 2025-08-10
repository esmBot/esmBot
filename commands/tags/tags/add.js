import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

const blacklist = ["create", "add", "edit", "remove", "delete", "list", "random", "own", "owner"];

class TagsAddCommand extends Command {
  async run() {
    if (!this.database) return this.getString("noDatabase");
    if (!this.guild) return this.getString("guildOnly");
    const owners = process.env.OWNER?.split(",") ?? [];
    const privileged = this.memberPermissions.has("ADMINISTRATOR") || owners.includes(this.author.id);
    const guild = await this.database.getGuild(this.guild.id);
    const setConv = new Set(guild.tag_roles);
    if (
      !privileged &&
      !setConv.has(this.guild.id) &&
      (!this.member || this.member.roles.filter((r) => setConv.has(r)).length == 0)
    )
      return this.getString("commands.responses.tags.noRolePerms");
    const tagName = this.args[0] ?? this.getOptionString("name");
    if (!tagName || !tagName.trim()) return this.getString("commands.responses.tags.addName");
    if (blacklist.includes(tagName)) return this.getString("commands.responses.tags.invalidName");
    const getResult = await this.database.getTag(this.guild.id, tagName);
    if (getResult) return this.getString("commands.responses.tags.exists");
    await this.database.setTag(
      {
        name: tagName,
        content: this.interaction
          ? this.interaction.data.options.getString("content", true)
          : this.args.slice(1).join(" "),
        author: this.author.id,
      },
      this.guild,
    );
    this.success = true;
    return this.getString("commands.responses.tags.added", {
      params: {
        name: tagName,
      },
    });
  }

  static flags = [
    {
      name: "name",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The name of the tag",
      required: true,
      classic: true,
    },
    {
      name: "content",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The content of the tag",
      required: true,
      classic: true,
    },
  ];

  static description = "Adds a tag";
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsAddCommand;
