import { readdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  type Client,
  Constants,
  type CreateApplicationCommandOptions,
  type CreateGuildApplicationCommandOptions,
} from "oceanic.js";
import Command from "#cmd-classes/command.js";
import commandConfig from "#config/commands.json" with { type: "json" };
import { aliases, categories, commands, info, messageCommands, paths, userCommands } from "./collections.ts";
import { getAllLocalizations } from "./i18n.ts";
import { log } from "./logger.ts";
import type { CommandEntry, CommandInfo, CommandsConfig, ExtendedCommandOptions, Param } from "./types.ts";

let queryValue = 0;

const basePath = dirname(fileURLToPath(import.meta.url));
const cmdPath = resolve(basePath, "..", "..", "commands");

const blacklist = (commandConfig as CommandsConfig).blacklist;

/**
 * Load a command into memory.
 */
export async function load(
  client: Client | null,
  command: string,
  skipSend?: boolean,
  subcommand?: false,
): Promise<string | undefined>;
export async function load(
  client: Client | null,
  command: string,
  skipSend?: boolean,
  subcommand?: true,
): Promise<
  | {
      props: typeof Command;
      info: CommandInfo;
      entry: CommandEntry;
      name: string;
    }
  | undefined
>;
export async function load(
  client: Client | null,
  command: string,
  skipSend = false,
  subcommand = false,
): Promise<
  | string
  | {
      props: typeof Command;
      info: CommandInfo;
      entry: CommandEntry;
      name: string;
    }
  | undefined
> {
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

  paths.set(fullCommandName, command);

  const cmdMap: CommandEntry = {
    default: props,
  };

  if (!subcommand) {
    if (commandInfo.category === "message") {
      messageCommands.set(commandName, cmdMap);
      commandInfo.type = Constants.ApplicationCommandTypes.MESSAGE;
    } else if (commandInfo.category === "user") {
      userCommands.set(commandName, cmdMap);
      commandInfo.type = Constants.ApplicationCommandTypes.USER;
    } else {
      try {
        const subdir = relPath.split(".")[0];
        const resolved = resolve(cmdPath, subdir);
        const files = await readdir(resolved, {
          withFileTypes: true,
        });
        commandInfo.baseCommand = true;
        commandInfo.flags = [];
        for (const file of files) {
          if (!file.isFile()) continue;
          const sub = await load(null, resolve(resolved, file.name), skipSend, true);
          if (!sub) continue;

          const split = sub.name.split(" ");
          const subName = split[split.length - 1];
          cmdMap[subName] = sub.props;

          const hasSubCommands = sub.info.flags.some(
            (v) => v.type === Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
          );
          commandInfo.flags.push({
            name: subName,
            nameLocalizations: getAllLocalizations(`commands.flagNames.${fullCommandName}.${subName}`),
            type: hasSubCommands
              ? Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP
              : Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            description: sub.info.description,
            descriptionLocalizations: getAllLocalizations(`commands.flags.${fullCommandName}.${subName}`),
            // @ts-expect-error It thinks we're using the wrong flag type
            options: sub.info.flags,
          });
        }
      } catch {
        // come back to this
      }
      commands.set(commandName, cmdMap);
    }
  }

  info.set(fullCommandName, commandInfo);

  if (client && props.slashAllowed && !skipSend && !subcommand) {
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

  return subcommand
    ? {
        props,
        info: commandInfo,
        entry: cmdMap,
        name: fullCommandName,
      }
    : fullCommandName;
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
  for (const name of merged.keys()) {
    const cmdInfo = info.get(name);
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
