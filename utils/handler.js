const collections = require("./collections.js");
const logger = require("./logger.js");

// load command into memory
exports.load = async (command, soundStatus) => {
  const props = require(`../commands/${command}`);
  if (props.requires === "google" && process.env.GOOGLE === "") return logger.log("info", `Google info not provided in config, skipped loading command ${command}...`);
  if (props.requires === "cat" && process.env.CAT === "") return logger.log("info", `Cat API info not provided in config, skipped loading command ${command}...`);
  if (props.requires === "mashape" && process.env.MASHAPE === "") return logger.log("info", `Mashape/RapidAPI info not provided in config, skipped loading command ${command}...`);
  if (props.requires === "twitter" && process.env.TWITTER === "false") return logger.log("info", `Twitter bot disabled, skipped loading command ${command}...`);
  if (props.requires === "sound" && soundStatus) return logger.log("info", `Failed to connect to some Lavalink nodes, skipped loading command ${command}...`);
  collections.commands.set(command.split(".")[0], props.run);
  collections.info.set(command.split(".")[0], {
    category: props.category,
    description: props.help,
    aliases: props.aliases,
    params: props.params
  });
  if (props.aliases) {
    for (const alias of props.aliases) {
      collections.aliases.set(alias, command.split(".")[0]);
    }
  }
  return false;
};

// unload command from memory
exports.unload = async (command) => {
  let cmd;
  if (collections.commands.has(command)) {
    cmd = collections.commands.get(command);
  } else if (collections.aliases.has(command)) {
    cmd = collections.commands.get(collections.aliases.get(command));
  }
  if (!cmd) return `The command \`${command}\` doesn't seem to exist, nor is it an alias.`;
  const mod = require.cache[require.resolve(`../commands/${command}`)];
  delete require.cache[require.resolve(`../commands/${command}.js`)];
  for (let i = 0; i < mod.parent.children.length; i++) {
    if (mod.parent.children[i] === mod) {
      mod.parent.children.splice(i, 1);
      break;
    }
  }
  return false;
};
