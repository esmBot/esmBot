exports.run = async (message) => {
  return `${message.author.mention}, you can invite me to your server here: <https://discordapp.com/oauth2/authorize?client_id=515571942418546689&scope=bot&permissions=70642766>`;
};

exports.category = 1;
exports.help = "Gets my bot invite link";