import packageJson from "../../package.json" with { type: "json" };
import Command from "../../classes/command.js";
import { getServers } from "../../utils/misc.js";

class InfoCommand extends Command {
  async run() {
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
    let owner = this.client.users.get(process.env.OWNER.split(",")[0]);
    if (!owner) owner = await this.client.rest.users.get(process.env.OWNER.split(",")[0]);
    const servers = await getServers(this.client);
    await this.acknowledge();
    return {
      embeds: [{
        color: 0xff0000,
        author: {
          name: "esmBot Info/Credits",
          iconURL: this.client.user.avatarURL()
        },
        description: `This instance is managed by **${owner.username}${owner.discriminator === 0 ? `#${owner.discriminator}` : ""}**`,
        fields: [{
          name: "ℹ️ Version:",
          value: `v${packageJson.version}${process.env.NODE_ENV === "development" ? `-dev (${process.env.GIT_REV})` : ""}`
        },
        {
          name: "📝 Credits:",
          value: "Bot by **[Essem](https://essem.space)** and **[various contributors](https://github.com/esmBot/esmBot/graphs/contributors)**\nLogo by **[MintBurrow](https://twitter.com/MintBurrow)**"
        },
        {
          name: "💬 Total Servers:",
          value: servers ? servers : `${this.client.guilds.size} (for this process only)`
        },
        {
          name: "✅ Official Server:",
          value: "[Click here!](https://esmbot.net/support)"
        },
        {
          name: "💻 Source Code:",
          value: "[Click here!](https://github.com/esmBot/esmBot)"
        },
        {
          name: "🌐 Translate:",
          value: "[Click here!](https://translate.codeberg.org/projects/esmbot/esmbot/)"
        },
        {
          name: "🛡️ Privacy Policy:",
          value: "[Click here!](https://esmbot.net/privacy.html)"
        },
        {
          name: "🐘 Mastodon:",
          value: "[Click here!](https://wetdry.world/@esmBot)",
          inline: true
        },
        {
          name: "🦋 Bluesky:",
          value: "[Click here!](https://bsky.app/profile/esmbot.net)",
          inline: true
        }
        ]
      }]
    };
  }

  static description = "Gets some info and credits about me";
  static aliases = ["botinfo", "credits"];
}

export default InfoCommand;