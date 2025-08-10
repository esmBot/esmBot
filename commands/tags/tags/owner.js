import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class TagsOwnerCommand extends Command {
  async run() {
    if (!this.database) return this.getString("noDatabase");
    if (!this.guild) return this.getString("guildOnly");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const tagName = this.args[0] ?? this.getOptionString("name");
    if (!tagName) return this.getString("commands.responses.tags.noInput");
    const getResult = await this.database.getTag(this.guild.id, tagName);
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    const user = this.client.users.get(getResult.author);
    this.success = true;
    if (!user) {
      try {
        const restUser = await this.client.rest.users.get(getResult.author);
        return this.getString("commands.responses.tags.ownedBy", {
          params: {
            user: restUser.username,
            id: getResult.author,
          },
        });
      } catch {
        return this.getString("commands.responses.tags.ownedById", {
          params: {
            id: getResult.author,
          },
        });
      }
    } else {
      return this.getString("commands.responses.tags.ownedBy", {
        params: {
          user: user?.username,
          id: getResult.author,
        },
      });
    }
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

  static description = "Gets the owner of a tag";
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsOwnerCommand;
