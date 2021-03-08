exports.run = async (message, args) => {
  if (!args[0]) return `${message.author.mention}, you need to provide a snowflake ID!`;
  if (!args[0].match(/^<?[@#]?[&!]?\d+>?$/) && args[0] < 21154535154122752) return `${message.author.mention}, that's not a valid snowflake!`;
  return new Date((args[0].replaceAll("@", "").replaceAll("#", "").replaceAll("!", "").replaceAll("&", "").replaceAll("<", "").replaceAll(">", "") / 4194304) + 1420070400000).toUTCString();
};

exports.aliases = ["timestamp", "snowstamp", "snow"];
exports.category = 1;
exports.help = "Converts a Discord snowflake id into a timestamp";
exports.params = "[id]";