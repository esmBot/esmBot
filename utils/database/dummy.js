// dummy (no-op) database handler
import { warn } from "../logger.js";

export async function setup() {
  warn("Using dummy database adapter. If this isn't what you wanted, check your DB variable.");
}
export async function stop() {}
export async function fixGuild() {}
export async function addCount() {}
export async function getCounts() {
  return {};
}
export async function upgrade() {}
export async function disableCommand() {}
export async function enableCommand() {}
export async function disableChannel() {}
export async function enableChannel() {}
export async function getTags() {}
export async function getTag() {}
export async function setTag() {}
export async function removeTag() {}
export async function editTag() {}
export async function setPrefix() {}
export async function addGuild(guild) {
  return {
    id: guild.id,
    tags: {},
    prefix: process.env.PREFIX,
    disabled: [],
    disabled_commands: []
  };
}
export const getGuild = addGuild;
