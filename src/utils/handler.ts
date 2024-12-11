import { paths, commands, messageCommands, userCommands, info, categories, aliases as _aliases } from "./collections.js";
import { log } from "./logger.js";

import commandConfig from "#config/commands.json" with { type: "json" };
import { Constants, type ApplicationCommandOptions, type Client } from "oceanic.js";
import { getAllLocalizations } from "./i18n.js";
import Command from "#cmd-classes/command.js";

let queryValue = 0;

type CommandInfo = {
  category: string;
  description: string;
  aliases: string[];
  params: (string | object)[];
  flags: ExtendedCommandOptions[];
  slashAllowed: boolean;
  directAllowed: boolean;
  userAllowed: boolean;
  adminOnly: boolean;
  type: Constants.ApplicationCommandTypes;
};

type ExtendedCommandOptions = {
  classic?: boolean;
} & ApplicationCommandOptions;

/**
 * Load a command into memory.
 */
export async function load(client: Client | null, command: string, skipSend = false) {
  const { default: props } = await import(`${command}?v=${queryValue}`) as { default: typeof Command };
  queryValue++;
  const commandArray = command.split("/");
  let commandName = commandArray[commandArray.length - 1].split(".")[0];
  const category = commandArray[commandArray.length - 2];

  if (commandConfig.blacklist.includes(commandName)) {
    log("warn", `Skipped loading blacklisted command ${command}...`);
    return;
  }

  if (!(props.prototype instanceof Command)) {
    log("warn", `Command ${command} is invalid, skipping...`);
    return;
  }

  if (category === "message" || category === "user") {
    const nameStringArray = commandName.split("-");
    for (const index of nameStringArray.keys()) {
      nameStringArray[index] = nameStringArray[index].charAt(0).toUpperCase() + nameStringArray[index].slice(1);
    }
    commandName = nameStringArray.join(" ");
  }

  props.init();
  paths.set(commandName, command);

  const extendedFlags = extendFlags(props.flags, commandName);

  const commandInfo: CommandInfo = {
    category: category,
    description: props.description,
    aliases: props.aliases,
    params: parseFlags(props.flags),
    flags: extendedFlags,
    slashAllowed: props.slashAllowed,
    directAllowed: props.directAllowed,
    userAllowed: props.userAllowed,
    adminOnly: props.adminOnly,
    type: Constants.ApplicationCommandTypes.CHAT_INPUT
  };

  if (category === "message") {
    messageCommands.set(commandName, props);
    commandInfo.type = Constants.ApplicationCommandTypes.MESSAGE;
  } else if (category === "user") {
    userCommands.set(commandName, props);
    commandInfo.type = Constants.ApplicationCommandTypes.USER;
  } else {
    commands.set(commandName, props);
  }

  if (client && props.slashAllowed && !skipSend) {
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
 */
function parseFlags(flags: ExtendedCommandOptions[]) {
  const params: (string | object)[] = [];
  for (const flag of flags) {
    if (flag.type === 1) {
      const sub = { name: flag.name, desc: flag.description, params: undefined };
      if (flag.options) sub.params = parseFlags(flag.options);
      params.push(sub);
    } else {
      if (!flag.classic) continue;
      params.push(`${flag.required ? "[" : "{"}${flag.name}${flag.required ? "]" : "}"}`);
    }
  }
  return params;
}

function extendFlags(flags: ExtendedCommandOptions[], name: string) {
  const outFlags: ExtendedCommandOptions[] = [];
  for (const flag of flags) {
    if (!flag.nameLocalizations) flag.nameLocalizations = getAllLocalizations(`commands.flagNames.${name}.${flag.name}`);
    if (!flag.descriptionLocalizations) flag.descriptionLocalizations = getAllLocalizations(`commands.flags.${name}.${flag.name}`);
    if (flag.type === 1 && flag.options) {
      const nameWithFlag = `${name} ${flag.name}`;
      extendFlags(flag.options, nameWithFlag);
    }
    outFlags.push(flag);
  }
  return outFlags;
}

export function update() {
  const commandArray = [];
  const privateCommandArray = [];
  const merged = new Map([...commands, ...messageCommands, ...userCommands]);
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
    if (cmdInfo?.type === Constants.ApplicationCommandTypes.MESSAGE || cmdInfo?.type === Constants.ApplicationCommandTypes.USER) {
      (cmdInfo.adminOnly ? privateCommandArray : commandArray).push({
        name: name,
        nameLocalizations: getAllLocalizations(`commands.names.${name}`),
        type: cmdInfo.type,
        integrationTypes: [0, cmdInfo.userAllowed ? 1 : null].filter(v => v !== null),
        contexts: [0, cmdInfo.directAllowed ? 1 : null, 2].filter(v => v !== null)
      });
    } else if (cmdInfo?.slashAllowed) {
      (cmdInfo.adminOnly ? privateCommandArray : commandArray).push({
        name,
        nameLocalizations: getAllLocalizations(`commands.names.${name}`),
        type: cmdInfo.type,
        description: cmdInfo.description,
        descriptionLocalizations: getAllLocalizations(`commands.descriptions.${name}`),
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

export async function send(bot: Client) {
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