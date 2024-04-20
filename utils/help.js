import { commands, info } from "./collections.js";
import { promises } from "node:fs";

export const categoryTemplate = {
  general: [],
  tags: ["> **Every command in this category is a subcommand of the tag command.**\n"],
  "image-editing": ["> **These commands support the PNG, JPEG, WEBP (static), and GIF (animated or static) formats.**\n"]
};
export let categories = categoryTemplate;

export let generated = false;

function generateEntries(baseName, params, desc, categories, category) {
  let entry = `**${baseName}**`;
  const sorted = [];
  let generated = false;
  for (const param of params) {
    if (typeof param !== "string") {
      generateEntries(`${baseName} ${param.name}`, param.params ?? [], param.desc, categories, category);
      generated = true;
    } else {
      sorted.push(param);
    }
  }
  if (generated) return;
  entry += `${sorted.length > 0 ? ` ${sorted.join(" ")}` : ""} - ${desc}`;
  categories[category].push(entry);
}

export function generateList() {
  categories = categoryTemplate;
  for (const [command] of commands) {
    const cmd = info.get(command);
    if (!categories[cmd.category]) categories[cmd.category] = [];
    if (command !== "music") generateEntries(command, cmd.params, cmd.description, categories, cmd.category);
  }
  generated = true;
}

/**
 * @param {string} output
 */
export async function createPage(output) {
  let template = `# <img src="https://raw.githubusercontent.com/esmBot/esmBot/master/docs/assets/esmbot.png" width="64"> esmBot${process.env.NODE_ENV === "development" ? " Dev" : ""} Command List

This page was last generated on \`${new Date().toString()}\`.

\`[]\` means an argument is required, \`{}\` means an argument is optional.

**Want to help support esmBot's development? Consider donating on Patreon!** https://patreon.com/TheEssem
`;

  template += "\n## Table of Contents\n";
  for (const category of Object.keys(categories)) {
    const categoryStringArray = category.split("-");
    for (const index of categoryStringArray.keys()) {
      categoryStringArray[index] = categoryStringArray[index].charAt(0).toUpperCase() + categoryStringArray[index].slice(1);
    }
    template += `+ [**${categoryStringArray.join(" ")}**](#${category})\n`;
  }

  // hell
  for (const category of Object.keys(categories)) {
    const categoryStringArray = category.split("-");
    for (const index of categoryStringArray.keys()) {
      categoryStringArray[index] = categoryStringArray[index].charAt(0).toUpperCase() + categoryStringArray[index].slice(1);
    }
    template += `\n## ${categoryStringArray.join(" ")}\n`;
    for (const command of categories[category]) {
      if (command.startsWith(">")) {
        template += `${command}\n`;
      } else {
        template += `+ ${command}\n`;
      }
    }
  }

  await promises.writeFile(output, template);
}