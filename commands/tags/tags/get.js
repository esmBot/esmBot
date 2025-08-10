import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class TagsGetCommand extends Command {
  async run() {
    if (!this.database) return this.getString("noDatabase");
    if (!this.guild) return this.getString("guildOnly");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    // @ts-expect-error this.constructor allows us to get static properties, but TS interprets it as a pure function
    const tagName = this.constructor.tag ?? this.args[0] ?? this.getOptionString("name");
    if (!tagName) return this.getString("commands.responses.tags.noInput");
    const getResult = await this.database.getTag(this.guild.id, tagName);
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    this.success = true;
    if (getResult.content.length > 2000) {
      return {
        embeds: [
          {
            color: 0xff0000,
            description: getResult.content,
          },
        ],
      };
    }
    return getResult.content;
  }

  static flags = [
    {
      name: "name",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The name of the tag",
      required: true,
      classic: true,
    },
  ];

  static description = "Gets a tag";
  static tag = null;
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsGetCommand;
