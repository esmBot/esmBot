const { clean } = require("../utils/misc.js");

exports.run = async (message, args) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, only the bot owner can use eval!`;
  const code = args.join(" ");
  try {
    const evaled = eval(code);
    const cleaned = await clean(evaled);
    return `\`\`\`js\n${cleaned}\n\`\`\``;
  } catch (err) {
    return `\`ERROR\` \`\`\`xl\n${await clean(err)}\n\`\`\``;
  }
};

exports.aliases = ["run"];
exports.category = 7;
exports.help = "Executes JavaScript code";