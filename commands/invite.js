exports.run = async (message) => {
  return `${message.author.mention}, you can invite me to your server here: <https://projectlounge.pw/invite${process.env.NODE_ENV === "development" ? "dev" : ""}>`;
};

exports.category = 1;
exports.help = "Gets my bot invite link";