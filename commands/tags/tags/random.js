import Command from "#cmd-classes/command.js";
import { random } from "#utils/misc.js";

class TagsRandomCommand extends Command {
  async run() {
    if (!this.database) return this.getString("noDatabase");
    if (!this.guild) return this.getString("guildOnly");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const tagList = await this.database.getTags(this.guild.id);
    const tagKeys = Object.keys(tagList);
    if (tagKeys.length === 0) return this.getString("commands.responses.tags.noTags");
    const getResult = tagList[random(tagKeys)];
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

  static description = "Gets a random tag";
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsRandomCommand;
