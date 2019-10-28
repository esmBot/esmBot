const database = require("../utils/database.js");

exports.run = async (message) => {
  const guild = (await database.find({ id: message.channel.guild.id }).exec())[0];
  return `${message.author.mention}, my command list can be found here: https://essem.space/esmBot/commands.html?dev=true\nThis server's prefix is \`${guild.prefix}\`.`;
};
