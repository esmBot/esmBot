import { readdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  type ApplicationCommandOptions,
  type Client,
  type CombinedApplicationCommandOption,
  Constants,
  type CreateApplicationCommandOptions,
  type CreateGuildApplicationCommandOptions,
} from "oceanic.js";
import Command from "#cmd-classes/command.js";
import commandConfig from "#config/commands.json" with { type: "json" };
import { aliases, categories, commands, messageCommands, paths, userCommands } from "./collections.ts";
import { getAllLocalizations } from "./i18n.ts";
import { log } from "./logger.ts";
import type {
  CommandFlagType,
  CommandsConfig,
  ExtCommand,
  ExtendedCommandOptions,
  ExtendedConstructedCommandOptions,
  Param,
} from "./types.ts";

let queryValue = 0;

const basePath = dirname(fileURLToPath(import.meta.url));
const cmdPath = resolve(basePath, "..", "..", "commands");

const blacklist = (commandConfig as CommandsConfig).blacklist;

/**
 * Load a command into memory.
 */
export async function load(command: string): Promise<
  | {
      props: ExtCommand;
      name: string;
    }
  | undefined
> {
  log("main", `Loading command from ${command}...`);
  const { default: props } = (await import(`${command}?v=${queryValue}`)) as { default: ExtCommand };
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
  props.baseCommand = false;
  props.category = category;
  props.type = Constants.ApplicationCommandTypes.CHAT_INPUT;
  props.params = parseFlags(props.flags);
  props.flags = extendFlags(props.flags, fullCommandName);

  paths.set(fullCommandName, command);

  if (category === "message") {
    messageCommands.set(fullCommandName, props);
    props.type = Constants.ApplicationCommandTypes.MESSAGE;
  } else if (category === "user") {
    userCommands.set(fullCommandName, props);
    props.type = Constants.ApplicationCommandTypes.USER;
  } else {
    const subdir = relPath.split(".")[0];
    const resolved = resolve(cmdPath, subdir);

    let files;
    try {
      files = await readdir(resolved, {
        withFileTypes: true,
      });
    } catch {
      log("debug", `Could not find subcommand dir at ${resolved}`);
    }

    if (files) {
      props.baseCommand = true;
      props.flags = [];
      for (const file of files) {
        if (!file.isFile()) continue;
        const sub = await load(resolve(resolved, file.name));
        if (!sub) continue;

        const split = sub.name.split(" ");
        const subName = split[split.length - 1];

        const hasSubCommands = sub.props.flags.some(
          (v) => v.type === Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        );
        props.flags.push({
          name: subName,
          nameLocalizations: getAllLocalizations(`commands.flagNames.${fullCommandName}.${subName}`),
          type: hasSubCommands
            ? Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP
            : Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
          description: sub.props.description,
          descriptionLocalizations: getAllLocalizations(`commands.flags.${fullCommandName}.${subName}`),
          options: sub.props.flags as CombinedApplicationCommandOption[],
        });
      }
    }

    commands.set(fullCommandName, props);
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

  return {
    props,
    name: fullCommandName,
  };
}

export const flagMap: Array<CommandFlagType | null> = [
  null,
  null,
  null,
  "string",
  "integer",
  "boolean",
  "user",
  "channel",
  "role",
  "mentionable",
  "number",
  "attachment",
];

export function convFlagType(type: ExtendedConstructedCommandOptions["type"]): Constants.ApplicationCommandOptionTypes {
  if (typeof type === "number") return type;
  return flagMap.indexOf(type);
}

/**
 * Convert command flags to params
 */
function parseFlags(flags: ExtendedConstructedCommandOptions[]) {
  const params: Param[] = [];
  for (const flag of flags) {
    const convedType = convFlagType(flag.type);
    if (convedType < 0) throw new Error(`Invalid flag type on ${flag.name}`);
    flag.type = convedType;
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

function extendFlags(flags: ExtendedConstructedCommandOptions[], name: string) {
  const outFlags: ExtendedCommandOptions[] = [];
  for (const flag of flags) {
    if (!flag.nameLocalizations)
      flag.nameLocalizations = getAllLocalizations(`commands.flagNames.${name}.${flag.name}`);
    if (!flag.descriptionLocalizations)
      flag.descriptionLocalizations = getAllLocalizations(`commands.flags.${name}.${flag.name}`);
    const convedType = convFlagType(flag.type);
    if (convedType < 0) throw new Error(`Invalid flag type on ${flag.name}`);
    flag.type = convedType;
    if (
      (flag.type === Constants.ApplicationCommandOptionTypes.SUB_COMMAND ||
        flag.type === Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP) &&
      flag.options
    ) {
      const nameWithFlag = `${name} ${flag.name}`;
      extendFlags(flag.options, nameWithFlag);
    }
    outFlags.push(flag as ExtendedCommandOptions);
  }
  return outFlags;
}

export function update() {
  const commandArray: CreateApplicationCommandOptions[] = [];
  const privateCommandArray: CreateApplicationCommandOptions[] = [];
  const merged = new Map([...commands, ...messageCommands, ...userCommands]);
  for (const [name, cmd] of merged) {
    // skip slash commands with spaces in the title
    if (cmd.type === Constants.ApplicationCommandTypes.CHAT_INPUT && name.includes(" ")) continue;
    if (cmd.type === Constants.ApplicationCommandTypes.MESSAGE || cmd.type === Constants.ApplicationCommandTypes.USER) {
      (cmd.adminOnly ? privateCommandArray : commandArray).push({
        name: name,
        nameLocalizations: getAllLocalizations(`commands.names.${name}`),
        type: cmd.type,
        integrationTypes: [0, cmd.userAllowed ? 1 : null].filter((v) => v !== null),
        contexts: [0, cmd.directAllowed ? 1 : null, 2].filter((v) => v !== null),
      });
    } else if (cmd.slashAllowed) {
      (cmd.adminOnly ? privateCommandArray : commandArray).push({
        name,
        nameLocalizations: getAllLocalizations(`commands.names.${name}`),
        type: cmd.type.valueOf(),
        description: cmd.description,
        descriptionLocalizations: getAllLocalizations(`commands.descriptions.${name}`),
        options: cmd.flags as ApplicationCommandOptions[],
        integrationTypes: [0, cmd.userAllowed ? 1 : null].filter((v) => v !== null),
        contexts: [0, cmd.directAllowed ? 1 : null, 2].filter((v) => v !== null),
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
