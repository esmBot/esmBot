import { paths, commands, messageCommands, info, categories, aliases as _aliases } from "./collections.js";
import { log } from "./logger.js";

import { readFileSync } from "fs";

const { blacklist } = JSON.parse(readFileSync(new URL("../config/commands.json", import.meta.url)));

let queryValue = 0;

// load command into memory
export async function load(client, command, slashReload = false) {
  const { default: props } = await import(`${command}?v=${queryValue}`);
  queryValue++;
  const commandArray = command.split("/");
  let commandName = commandArray[commandArray.length - 1].split(".")[0];
  const category = commandArray[commandArray.length - 2];

  if (blacklist.includes(commandName)) {
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
    params: props.arguments,
    flags: props.flags,
    slashAllowed: props.slashAllowed,
    directAllowed: props.directAllowed,
    adminOnly: props.adminOnly,
    type: 1
  };

  if (category === "message") {
    messageCommands.set(commandName, props);
    commandInfo.type = 3;
  } else {
    commands.set(commandName, props);
  }

  if (slashReload && props.slashAllowed) {
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
        params: cmd.arguments,
        flags: cmd.flags,
        slashAllowed: cmd.slashAllowed,
        directAllowed: cmd.directAllowed,
        adminOnly: cmd.adminOnly,
        type: cmdInfo.type
      };
      info.set(name, cmdInfo);
    }
    if (cmdInfo?.type === 3) {
      (cmdInfo.adminOnly ? privateCommandArray : commandArray).push({
        name: name,
        type: cmdInfo.type,
        dm_permission: cmdInfo.directAllowed
      });
    } else if (cmdInfo?.slashAllowed) {
      (cmdInfo.adminOnly ? privateCommandArray : commandArray).push({
        name,
        type: cmdInfo.type,
        description: cmdInfo.description,
        options: cmdInfo.flags,
        dm_permission: cmdInfo.directAllowed
      });
    }
  }
  return {
    main: commandArray,
    private: privateCommandArray
  };
}

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