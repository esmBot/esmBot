import process from "node:process";
import { aliases, categories, commands, info, messageCommands, paths, userCommands } from "./collections.ts";
import { log } from "./logger.ts";

import { deepmergeInto } from "deepmerge-ts";
import {
  type Client,
  Constants,
  type CreateApplicationCommandOptions,
  type CreateGuildApplicationCommandOptions,
} from "oceanic.js";
import Command from "#cmd-classes/command.js";
import commandConfig from "#config/commands.json" with { type: "json" };
import { getAllLocalizations } from "./i18n.ts";
import type { CommandEntry, CommandInfo, CommandsConfig, ExtendedCommandOptions, Param } from "./types.ts";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let queryValue = 0;

const basePath = dirname(fileURLToPath(import.meta.url));
const cmdPath = resolve(basePath, "..", "..", "commands");

const blacklist = (commandConfig as CommandsConfig).blacklist;

/**
 * Load a command into memory.
 */
export async function load(client: Client | null, command: string, skipSend = false) {
  log("main", `Loading command from ${command}...`);
  const { default: props } = (await import(`${command}?v=${queryValue}`)) as { default: typeof Command };
  queryValue++;

  const relPath = relative(cmdPath, command);
  const commandArray = relPath.split("/");
  let commandName = commandArray[commandArray.length - 1].split(".")[0];
  const category = commandArray[0];
  const subPath = commandArray.slice(1, -1);

  if (!(props?.prototype instanceof Command)) {
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

  let fullCommandName = commandName;
  if (subPath.length > 0) fullCommandName = `${subPath.join(" ")} ${commandName}`;

  if (blacklist.includes(subPath[0]) || blacklist.includes(fullCommandName)) {
    log("warn", `Skipped loading blacklisted command ${command}...`);
    return;
  }

  props.init();
  paths.set(fullCommandName, command);

  const extendedFlags = extendFlags(props.flags, fullCommandName);

  const commandInfo: CommandInfo = {
    category: category,
    description: props.description,
    aliases: props.aliases,
    params: parseFlags(props.flags),
    flags: extendedFlags,
    slashAllowed: props.slashAllowed,
    directAllowed: props.directAllowed,
    userAllowed: props.userAllowed,
    baseCommand: false,
    adminOnly: props.adminOnly,
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  };

  if (category === "message") {
    messageCommands.set(commandName, {
      default: props,
    });
    commandInfo.type = Constants.ApplicationCommandTypes.MESSAGE;
  } else if (category === "user") {
    userCommands.set(commandName, {
      default: props,
    });
    commandInfo.type = Constants.ApplicationCommandTypes.USER;
  } else {
    const existingCmd = commands.get(subPath[0] ?? commandName);
    const cmdMap = subPath.slice(1).reduceRight((acc: CommandEntry, p) => ({ [p]: acc }), {
      [subPath.length > 0 ? commandName : "default"]: props,
    });
    if (existingCmd) deepmergeInto(cmdMap, existingCmd);
    commands.set(subPath[0] ?? commandName, cmdMap);
  }

  info.set(fullCommandName, commandInfo);

  if (client && props.slashAllowed && !skipSend) {
    await send(client);
  }

  const categoryCommands = categories.get(category) ?? new Set<string>();
  categoryCommands.add(fullCommandName);
  categories.set(category, categoryCommands);

  if (props.aliases) {
    for (const alias of props.aliases) {
      aliases.set(alias, fullCommandName);
      paths.set(alias, command);
    }
  }
  return fullCommandName;
}

/**
 * Convert command flags to params
 */
function parseFlags(flags: ExtendedCommandOptions[]) {
  const params: Param[] = [];
  for (const flag of flags) {
    if (
      flag.type === Constants.ApplicationCommandOptionTypes.SUB_COMMAND ||
      flag.type === Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP
    ) {
      const sub = { name: flag.name, desc: flag.description, params: [] as Param[] };
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
    if (!flag.nameLocalizations)
      flag.nameLocalizations = getAllLocalizations(`commands.flagNames.${name}.${flag.name}`);
    if (!flag.descriptionLocalizations)
      flag.descriptionLocalizations = getAllLocalizations(`commands.flags.${name}.${flag.name}`);
    if (
      (flag.type === Constants.ApplicationCommandOptionTypes.SUB_COMMAND ||
        flag.type === Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP) &&
      flag.options
    ) {
      const nameWithFlag = `${name} ${flag.name}`;
      extendFlags(flag.options, nameWithFlag);
    }
    outFlags.push(flag);
  }
  return outFlags;
}

export function update() {
  const commandArray: CreateApplicationCommandOptions[] = [];
  const privateCommandArray: CreateApplicationCommandOptions[] = [];
  const merged = new Map([...commands, ...messageCommands, ...userCommands]);
  for (const [name, command] of merged.entries()) {
    const subcommands = Object.keys(command);
    const subcommandInfo: Record<string, CommandInfo> = {};
    for (const subcommand of subcommands) {
      const subcommandName = subcommand === "default" ? name : `${name} ${subcommand}`;

      let subCmdInfo = info.get(subcommandName);
      const cmd = command[subcommand] as typeof Command;
      subCmdInfo = {
        category: subCmdInfo?.category ?? "unsorted",
        description: cmd.description,
        aliases: cmd.aliases,
        params: parseFlags(cmd.flags),
        flags: cmd.flags,
        slashAllowed: cmd.slashAllowed,
        directAllowed: cmd.directAllowed,
        userAllowed: cmd.userAllowed,
        baseCommand: subcommand === "default" && subcommands.length > 1,
        adminOnly: cmd.adminOnly,
        type: subCmdInfo?.type ?? Constants.ApplicationCommandTypes.CHAT_INPUT,
      };
      info.set(subcommandName, subCmdInfo);
      if (subcommand !== "default") subcommandInfo[subcommand] = subCmdInfo;
    }
    const cmdInfo = info.get(name);
    if (subcommands.length > 1) {
      // what the hell??
      if (cmdInfo?.flags.length === 0) cmdInfo.flags = [];
      for (const [subName, sub] of Object.entries(subcommandInfo)) {
        if (!sub.slashAllowed) continue;
        cmdInfo!.flags.push({
          name: subName,
          nameLocalizations: getAllLocalizations(`commands.flagNames.${name}.${subName}`),
          type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
          description: sub.description,
          descriptionLocalizations: getAllLocalizations(`commands.flags.${name}.${subName}`),
          // @ts-expect-error It thinks we're using the wrong flag type
          options: sub.flags,
        });
      }
    }
    if (
      cmdInfo?.type === Constants.ApplicationCommandTypes.MESSAGE ||
      cmdInfo?.type === Constants.ApplicationCommandTypes.USER
    ) {
      (cmdInfo.adminOnly ? privateCommandArray : commandArray).push({
        name: name,
        nameLocalizations: getAllLocalizations(`commands.names.${name}`),
        type: cmdInfo.type,
        integrationTypes: [0, cmdInfo.userAllowed ? 1 : null].filter((v) => v !== null),
        contexts: [0, cmdInfo.directAllowed ? 1 : null, 2].filter((v) => v !== null),
      });
    } else if (cmdInfo?.slashAllowed) {
      (cmdInfo.adminOnly ? privateCommandArray : commandArray).push({
        name,
        nameLocalizations: getAllLocalizations(`commands.names.${name}`),
        type: cmdInfo.type.valueOf(),
        description: cmdInfo.description,
        descriptionLocalizations: getAllLocalizations(`commands.descriptions.${name}`),
        options: cmdInfo.flags,
        integrationTypes: [0, cmdInfo.userAllowed ? 1 : null].filter((v) => v !== null),
        contexts: [0, cmdInfo.directAllowed ? 1 : null, 2].filter((v) => v !== null),
      });
    }
  }
  return {
    main: commandArray,
    private: privateCommandArray,
  };
}

export async function send(bot: Client) {
  const commandArray = update();
  log("info", "Sending application command data to Discord...");
  let cmdArray = commandArray.main;
  if (process.env.ADMIN_SERVER && process.env.ADMIN_SERVER !== "") {
    await bot.application.bulkEditGuildCommands(
      process.env.ADMIN_SERVER,
      commandArray.private as CreateGuildApplicationCommandOptions[],
    );
  } else {
    cmdArray = [...commandArray.main, ...commandArray.private];
  }
  await bot.application.bulkEditGlobalCommands(cmdArray);
}
