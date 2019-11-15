const { clean } = require("../utils/misc.js");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

exports.run = async (message, args) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, only the bot owner can use exec!`;
  const code = args.join(" ");
  try {
    const execed = await exec(code);
    if (execed.stderr) return `\`ERROR\` \`\`\`xl\n${await clean(execed.stderr)}\n\`\`\``;
    const cleaned = await clean(execed.stdout);
    return `\`\`\`bash\n${cleaned}\n\`\`\``;
  } catch (err) {
    return `\`ERROR\` \`\`\`xl\n${await clean(err)}\n\`\`\``;
  }
};

exports.aliases = ["runcmd"];
