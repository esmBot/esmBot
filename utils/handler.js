import { paths, commands, info, sounds, categories, aliases as _aliases } from "./collections.js";
import { log } from "./logger.js";

let queryValue = 0;

// load command into memory
export async function load(client, cluster, worker, ipc, command, soundStatus, slashReload = false) {
  const { default: props } = await import(`${command}?v=${queryValue}`);
  queryValue++;
  if (props.requires.includes("sound") && soundStatus) {
    log("warn", `Failed to connect to some Lavalink nodes, skipped loading command ${command}...`);
    return;
  }
  const commandArray = command.split("/");
  const commandName = commandArray[commandArray.length - 1].split(".")[0];

  props.init();
  
  paths.set(commandName, command);
  commands.set(commandName, props);

  if (Object.getPrototypeOf(props).name === "SoundboardCommand") sounds.set(commandName, props.file);

  const category = commandArray[commandArray.length - 2];
  info.set(commandName, {
    category: category,
    description: props.description,
    aliases: props.aliases,
    params: props.arguments,
    flags: props.flags,
    slashAllowed: props.slashAllowed
  });

  const categoryCommands = categories.get(category);
  categories.set(category, categoryCommands ? [...categoryCommands, commandName] : [commandName]);

  if (slashReload && props.slashAllowed) {
    const commandList = await client.getCommands();
    const oldCommand = commandList.filter((item) => {
      return item.name === commandName;
    })[0];
    await client.editCommand(oldCommand.id, {
      name: commandName,
      type: 1,
      description: props.description,
      options: props.flags
    });
  }
  
  if (props.aliases) {
    for (const alias of props.aliases) {
      _aliases.set(alias, commandName);
      paths.set(alias, command);
    }
  }
  return commandName;
}

export async function update() {
  const commandArray = [];
  for (const [name, command] of commands.entries()) {
    let cmdInfo = info.get(name);
    if (command.postInit) {
      const cmd = command.postInit();
      //commands.set(name, cmd);
      cmdInfo = {
        category: cmdInfo.category,
        description: cmd.description,
        aliases: cmd.aliases,
        params: cmd.arguments,
        flags: cmd.flags,
        slashAllowed: cmd.slashAllowed
      };
      info.set(name, cmdInfo);
    }
    if (cmdInfo && cmdInfo.slashAllowed) commandArray.push({
      name,
      type: 1,
      description: cmdInfo.description,
      options: cmdInfo.flags
    });
  }
  return commandArray;
}