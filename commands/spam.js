exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide what you want to spam!`;
  if (message.content.indexOf("@everyone") > -1 || message.content.indexOf("@here") > -1) return "I don't know about you, but that seems like a bad idea.";
  return args.join(" ").repeat(500).substring(0, 500);
};