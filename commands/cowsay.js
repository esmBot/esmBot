const cowsay = require("cowsay2");
const cows = require("cowsay2/cows");

exports.run = async (message, args) => {
  if (args.length === 0) {
    return `${message.author.mention}, you need to provide some text for the cow to say!`;
  } else if (cows[args[0].toLowerCase()] != undefined) {
    const cow = cows[args.shift().toLowerCase()];
    return `\`\`\`\n${cowsay.say(args.join(" "), {
      cow
    })}\n\`\`\``;
  } else {
    return `\`\`\`\n${cowsay.say(args.join(" "))}\n\`\`\``;
  }
};

exports.aliases = ["cow"];
exports.category = 4;
exports.help = "Makes an ASCII cow say a message";
exports.params = "[text]";