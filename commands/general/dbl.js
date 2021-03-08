exports.run = async (message) => {
  return `${message.author.mention}, my DBL page can be found here: <https://top.gg/bot/429305856241172480>`;
};

exports.aliases = ["discordbotlist", "botlist", "discordbots"];
exports.category = 1;
exports.help = "Gets my top.gg page";