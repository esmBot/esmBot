import Command from "#cmd-classes/command.js";
import logger from "#utils/logger.js";

class DonateCommand extends Command {
  async run() {
    await this.acknowledge();
    let desc = "";
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);
    try {
      const patrons = await fetch("https://esmbot.net/patrons", { signal: controller.signal }).then((data) =>
        data.json(),
      );
      clearTimeout(timeout);
      for (const patron of patrons) {
        desc += `\n- **${patron}**`;
      }
    } catch (e) {
      logger.error(`Unable to get patron data: ${e}`);
    }
    return {
      embeds: [
        {
          author: {
            name: this.getString("commands.responses.donate.thanks"),
            iconURL: this.client.user.avatarURL(),
          },
          color: 0xff0000,
          description: desc,
          fields: [
            {
              name: this.getString("commands.responses.donate.like"),
              value: this.getString("commands.responses.donate.support", {
                params: {
                  patreon: "https://patreon.com/TheEssem",
                  kofi: "https://ko-fi.com/TheEssem",
                },
              }),
            },
          ],
        },
      ],
    };
  }

  static description = "Learn more about how you can support esmBot's development";
  static aliases = ["support", "patreon", "patrons"];
}

export default DonateCommand;
