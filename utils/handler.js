import { paths, commands, info, aliases as _aliases } from "./collections.js";
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
  
  paths.set(commandName, command);
  commands.set(commandName, props);

  const propsInstance = new props(client, cluster, worker, ipc, {});

  info.set(commandName, {
    category: commandArray[commandArray.length - 2],
    description: props.description,
    aliases: props.aliases,
    params: props.arguments,
    flags: propsInstance.flags ?? props.flags,
    slashAllowed: props.slashAllowed
  });

  if (slashReload && props.slashAllowed) {
    const commandList = await client.getCommands();
    const oldCommand = commandList.filter((item) => {
      return item.name === commandName;
    })[0];
    await client.editCommand(oldCommand.id, {
      name: commandName,
      type: 1,
      description: props.description,
      options: propsInstance.flags ?? props.flags
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
