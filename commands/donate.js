const client = require("../utils/client.js");

exports.run = async () => {
  let prefix = "";
  if (client.guilds.has("592399417676529688")) {
    const patrons = client.guilds.get("592399417676529688").members.filter((i) => {
      return i.roles.includes("741386733047906475");
    });
    prefix = "Thanks to the following patrons for their support:\n";
    for (const patron of patrons) {
      prefix += `**- ${patron.username}**\n`;
    }
    prefix += "\n";
  }
  return `${prefix}Like esmBot? Consider supporting the developer on Patreon to help keep it running! https://patreon.com/TheEssem`;
};

exports.aliases = ["support", "patreon", "patrons"];
exports.category = 1;
exports.help = "Learn more about how you can support esmBot's development";