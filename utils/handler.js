const collections = require("./collections.js");

exports.load = async (command) => {
  const props = require(`../commands/${command}`);
  collections.commands.set(command.split(".")[0], props.run);
  if (props.aliases) {
    props.aliases.forEach(alias => {
      collections.aliases.set(alias, command.split(".")[0]);
    });
  }
  return false;
};

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
