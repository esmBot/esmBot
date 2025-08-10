import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class TagsEditCommand extends Command {
  async run() {
    if (!this.database) return this.getString("noDatabase");
    if (!this.guild) return this.getString("guildOnly");
    const tagName = this.args[0] ?? this.getOptionString("name");
    if (!tagName || !tagName.trim()) return this.getString("commands.responses.tags.editName");
    const getResult = await this.database.getTag(this.guild.id, tagName);
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    const owners = process.env.OWNER?.split(",");
    if (
      getResult.author !== this.author.id &&
      !this.memberPermissions.has("MANAGE_MESSAGES") &&
      !owners?.includes(this.author.id)
    )
      return this.getString("commands.responses.tags.notOwner");
    await this.database.editTag(
      {
        name: tagName,
        content: this.interaction
          ? this.interaction.data.options.getString("content", true)
          : this.args.slice(2).join(" "),
        author: this.author.id,
      },
      this.guild,
    );
    this.success = true;
    return this.getString("commands.responses.tags.edited", {
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

  static description = "Edits an existing tag";
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsEditCommand;
