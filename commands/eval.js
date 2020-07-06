const { clean } = require("../utils/misc.js");

exports.run = async (message, args) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, only the bot owner can use eval!`;
  const code = args.join(" ");
  try {
    const evaled = eval(code);
    const cleaned = await clean(evaled);
    const sendString = `\`\`\`js\n${cleaned}\n\`\`\``;
    if (sendString.length >= 2000) {
      return {
        text: "The result was too large, so here it is as a file:",
        file: cleaned,
        name: "result.txt"
      };
    } else {
      return sendString;
    }
  } catch (err) {
    return `\`ERROR\` \`\`\`xl\n${await clean(err)}\n\`\`\``;
  }
};

exports.aliases = ["run"];
exports.category = 8;
exports.help = "Executes JavaScript code";
exports.params = "[code]";