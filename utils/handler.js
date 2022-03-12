import { paths, commands, info, aliases as _aliases } from "./collections.js";
import { log } from "./logger.js";

let queryValue = 0;

// load command into memory
export async function load(command, soundStatus) {
  const { default: props } = await import(`${command}?v=${queryValue}`);
  queryValue++;
  if (props.requires.includes("sound") && soundStatus) return log("warn", `Failed to connect to some Lavalink nodes, skipped loading command ${command}...`);
  const commandArray = command.split("/");
  const commandName = commandArray[commandArray.length - 1].split(".")[0];
  
  paths.set(commandName, command);
  commands.set(commandName, props);

  info.set(commandName, {
    category: commandArray[commandArray.length - 2],
    description: props.description,
    aliases: props.aliases,
    params: props.arguments,
    flags: props.flags
  });
  
  if (props.aliases) {
    for (const alias of props.aliases) {
      _aliases.set(alias, commandName);
      paths.set(alias, command);
    }
  }
  return false;
}
