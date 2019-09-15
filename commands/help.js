const database = require("../utils/database.js");

exports.run = async (message) => {
  const guildConf = database.settings.get(message.channel.guild.id);
  return `${message.author.mention}, my command list can be found here: https://essem.space/esmBot/commands.html?dev=true\nThis server's prefix is \`${guildConf.prefix}\`.`;
};
