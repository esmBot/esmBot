exports.run = async (message, args) => {
  if (!args[0].match(/^\d+$/) && args[0] < 21154535154122752) return `${message.author.mention}, that's not a valid snowflake!`;
  try {
    await message.channel.guild.banMember(args[0], 0, `hackban command used by @${message.author.username}#${message.author.discriminator}`);
    return `Successfully banned user with ID \`${args[0]}\`.`;
  } catch (e) {
    console.error(e);
    return `${message.author.mention}, I was unable to kick the member. Have you given me permissions?`;
  }
};

exports.aliases = ["prevent", "preban"];