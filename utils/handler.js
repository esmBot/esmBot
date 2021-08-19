import { paths, commands, info, aliases as _aliases } from "./collections.js";
import { log } from "./logger.js";
//import { Worker, isMainThread, workerData, parentPort } from "worker_threads";
//import { join, dirname } from "path";
//import { fileURLToPath } from "url";

/*const importNoCache = (module) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./handler.js", import.meta.url), {
      workerData: { module: module }
    });
    worker.once("message", (result) => {
      resolve(result);
    });
    worker.once("error", (result) => {
      reject(result);
    });
  });
};*/

// load command into memory
export async function load(command, soundStatus) {
  //const props = await importNoCache(`../${command}`);
  const { default: props } = await import(`../${command}`);
  if (props.requires.includes("mashape") && process.env.MASHAPE === "") return log("warn", `Mashape/RapidAPI info not provided in config, skipped loading command ${command}...`);
  if (props.requires.includes("sound") && soundStatus) return log("warn", `Failed to connect to some Lavalink nodes, skipped loading command ${command}...`);
  const commandArray = command.split("/");
  const commandName = commandArray[commandArray.length - 1].split(".")[0];
  
  paths.set(commandName, command);
  commands.set(commandName, props);

  info.set(commandName, {
    category: commandArray[2],
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

// unload command from memory
/*export async function unload(command) {
  let cmd;
  if (commands.has(command)) {
    cmd = commands.get(command);
  } else if (_aliases.has(command)) {
    cmd = commands.get(_aliases.get(command));
  }
  if (!cmd) return `The command \`${command}\` doesn't seem to exist, nor is it an alias.`;
  const path = paths.get(command);
  const mod = require.cache[require.resolve(`../${path}`)];
  delete require.cache[require.resolve(`../${path}`)];
  for (let i = 0; i < module.children.length; i++) {
    if (module.children[i] === mod) {
      module.children.splice(i, 1);
      break;
    }
  }
  return false;
}*/

/*if (!isMainThread) {
  const getModule = async () => {
    console.log("test");
    const module = await import(workerData.module);
    console.log("test 2");
    parentPort.postMessage(module);
    process.exit();
  };
  getModule();
}*/