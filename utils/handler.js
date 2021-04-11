const collections = require("./collections.js");
const logger = require("./logger.js");

// load command into memory
exports.load = async (command, soundStatus) => {
  const props = require(`../${command}`);
  if (props.requires.includes("google") && process.env.GOOGLE === "") return logger.log("warn", `Google info not provided in config, skipped loading command ${command}...`);
  if (props.requires.includes("cat") && process.env.CAT === "") return logger.log("warn", `Cat API info not provided in config, skipped loading command ${command}...`);
  if (props.requires.includes("mashape") && process.env.MASHAPE === "") return logger.log("warn", `Mashape/RapidAPI info not provided in config, skipped loading command ${command}...`);
  if (props.requires.includes("sound") && soundStatus) return logger.log("warn", `Failed to connect to some Lavalink nodes, skipped loading command ${command}...`);
  const commandArray = command.split("/");
  const commandName = commandArray[commandArray.length - 1].split(".")[0];
  
  collections.paths.set(commandName, command);
  collections.commands.set(commandName, props);

  collections.info.set(commandName, {
    category: commandArray[2],
    description: props.description,
    aliases: props.aliases,
    params: props.arguments
  });
  
  if (props.aliases) {
    for (const alias of props.aliases) {
      collections.aliases.set(alias, commandName);
      collections.paths.set(alias, command);
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
  const path = collections.paths.get(command);
  const mod = require.cache[require.resolve(`../${path}`)];
  delete require.cache[require.resolve(`../${path}`)];
  for (let i = 0; i < module.children.length; i++) {
    if (module.children[i] === mod) {
      module.children.splice(i, 1);
      break;
    }
  }
  return false;
};
