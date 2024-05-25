import { paths, commands, messageCommands, info, categories, aliases as _aliases } from "./collections.js";
import { log } from "./logger.js";

import commandConfig from "../config/commands.json" with { type: "json" };
import { Constants } from "oceanic.js";

let queryValue = 0;

/**
 * Load a command into memory.
 * @param {import("oceanic.js").Client | null} client
 * @param {string} command
 */
export async function load(client, command) {
  const { default: props } = await import(`${command}?v=${queryValue}`);
  queryValue++;
  const commandArray = command.split("/");
  let commandName = commandArray[commandArray.length - 1].split(".")[0];
  const category = commandArray[commandArray.length - 2];

  if (commandConfig.blacklist.includes(commandName)) {
    log("warn", `Skipped loading blacklisted command ${command}...`);
    return;
  }

  if (category === "message") {
    const nameStringArray = commandName.split("-");
    for (const index of nameStringArray.keys()) {
      nameStringArray[index] = nameStringArray[index].charAt(0).toUpperCase() + nameStringArray[index].slice(1);
    }
    commandName = nameStringArray.join(" ");
  }

  props.init();
  paths.set(commandName, command);

  const commandInfo = {
    category: category,
    description: props.description,
    aliases: props.aliases,
    params: parseFlags(props.flags),
    flags: props.flags,
    slashAllowed: props.slashAllowed,
    directAllowed: props.directAllowed,
    userAllowed: props.userAllowed,
    adminOnly: props.adminOnly,
    type: Constants.ApplicationCommandTypes.CHAT_INPUT
  };

  if (category === "message") {
    messageCommands.set(commandName, props);
    commandInfo.type = Constants.ApplicationCommandTypes.MESSAGE;
  } else {
    commands.set(commandName, props);
  }

  if (client && props.slashAllowed) {
    await send(client);
  }

  info.set(commandName, commandInfo);

  const categoryCommands = categories.get(category);
  categories.set(category, categoryCommands ? [...categoryCommands, commandName] : [commandName]);
  
  if (props.aliases) {
    for (const alias of props.aliases) {
      _aliases.set(alias, commandName);
      paths.set(alias, command);
    }
  }
  return commandName;
}

/**
 * Convert command flags to params
 * @param {object} flags
 * @returns {string[] | object[]}
 */
function parseFlags(flags) {
  const params = [];
  for (const flag of flags) {
    if (flag.type === 1) {
      const sub = { name: flag.name, desc: flag.description };
      if (flag.options) sub.params = parseFlags(flag.options);
      params.push(sub);
    } else {
      if (!flag.classic) continue;
      params.push(`${flag.required ? "[" : "{"}${flag.name}${flag.required ? "]" : "}"}`);
    }
  }
  return params;
}

export function update() {
  const commandArray = [];
  const privateCommandArray = [];
  const merged = new Map([...commands, ...messageCommands]);
  for (const [name, command] of merged.entries()) {
    let cmdInfo = info.get(name);
    if (command.postInit) {
      const cmd = command.postInit();
      cmdInfo = {
        category: cmdInfo.category,
        description: cmd.description,
        aliases: cmd.aliases,
        params: parseFlags(cmd.flags),
        flags: cmd.flags,
        slashAllowed: cmd.slashAllowed,
        directAllowed: cmd.directAllowed,
        userAllowed: cmd.userAllowed,
        adminOnly: cmd.adminOnly,
        type: cmdInfo.type
      };
      info.set(name, cmdInfo);
    }
    if (cmdInfo?.type === Constants.ApplicationCommandTypes.MESSAGE) {
      (cmdInfo.adminOnly ? privateCommandArray : commandArray).push({
        name: name,
        type: cmdInfo.type,
        integrationTypes: [0, cmdInfo.userAllowed ? 1 : null].filter(v => v !== null),
        contexts: [0, cmdInfo.directAllowed ? 1 : null, 2].filter(v => v !== null)
      });
    } else if (cmdInfo?.slashAllowed) {
      (cmdInfo.adminOnly ? privateCommandArray : commandArray).push({
        name,
        type: cmdInfo.type,
        description: cmdInfo.description,
        options: cmdInfo.flags,
        integrationTypes: [0, cmdInfo.userAllowed ? 1 : null].filter(v => v !== null),
        contexts: [0, cmdInfo.directAllowed ? 1 : null, 2].filter(v => v !== null)
      });
    }
  }
  return {
    main: commandArray,
    private: privateCommandArray
  };
}

/**
 * @param {import("oceanic.js").Client} bot
 */
export async function send(bot) {
  const commandArray = update();
  log("info", "Sending application command data to Discord...");
  let cmdArray = commandArray.main;
  if (process.env.ADMIN_SERVER && process.env.ADMIN_SERVER !== "") {
    await bot.application.bulkEditGuildCommands(process.env.ADMIN_SERVER, commandArray.private);
  } else {
    cmdArray = [...commandArray.main, ...commandArray.private];
  }
  await bot.application.bulkEditGlobalCommands(cmdArray);
}