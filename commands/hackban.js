exports.run = async (message, args) => {
  if (!args[0].match(/^<?[@#]?[&!]?\d+>?$/) && args[0] < 21154535154122752) return `${message.author.mention}, that's not a valid snowflake!`;
  try {
    const id = args[0].replace("@", "").replace("#", "").replace("!", "").replace("&", "").replace("<", "").replace(">", "");
    await message.channel.guild.banMember(id, 0, `Hackban command used by @${message.author.username}#${message.author.discriminator}`);
    return `Successfully banned user with ID \`${id}\`.`;
  } catch (e) {
    throw e;
    //return `${message.author.mention}, I was unable to ban the member. Have you given me permissions?`;
  }
};

exports.aliases = ["prevent", "preban"];
exports.category = 2;
exports.help = "Bans a member via user id";
exports.params = "[id]";