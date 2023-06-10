import { readFileSync } from "fs";
const { version } = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url)));
import Command from "../../classes/command.js";
import { getServers } from "../../utils/misc.js";

class InfoCommand extends Command {
  async run() {
    let owner = this.client.users.get(process.env.OWNER.split(",")[0]);
    if (!owner) owner = await this.client.rest.users.get(process.env.OWNER.split(",")[0]);
    const servers = await getServers(this.client);
    await this.acknowledge();
    return {
      embeds: [{
        color: 16711680,
        author: {
          name: "esmBot Info/Credits",
          iconURL: this.client.user.avatarURL()
        },
        description: `This instance is managed by **${owner.username}${owner.discriminator === 0 ? `#${owner.discriminator}` : ""}**`,
        fields: [{
          name: "ℹ️ Version:",
          value: `v${version}${process.env.NODE_ENV === "development" ? `-dev (${process.env.GIT_REV})` : ""}`
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
          name: "🛡️ Privacy Policy:",
          value: "[Click here!](https://esmbot.net/privacy.html)"
        },
        {
          name: "🐘 Mastodon:",
          value: "[Click here!](https://wetdry.world/@esmBot)"
        }
        ]
      }]
    };
  }

  static description = "Gets some info and credits about me";
  static aliases = ["botinfo", "credits"];
}

export default InfoCommand;