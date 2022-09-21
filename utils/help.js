import { commands, info } from "./collections.js";
import { promises } from "fs";

export const categoryTemplate = {
  general: [],
  tags: ["> **Every command in this category is a subcommand of the tag command.**\n"],
  "image-editing": ["> **These commands support the PNG, JPEG, WEBP (static), and GIF (animated or static) formats.**\n"]
};
export let categories = categoryTemplate;

export let generated = false;

export function generateList() {
  categories = categoryTemplate;
  for (const [command] of commands) {
    const category = info.get(command).category;
    const description = info.get(command).description;
    const params = info.get(command).params;
    if (category === "tags") {
      const subCommands = info.get(command).flags;
      categories.tags.push(`**tags** ${params.default} - ${description}`);
      for (const subCommand of subCommands) {
        categories.tags.push(`**tags ${subCommand.name}**${params[subCommand.name] ? ` ${params[subCommand.name].join(" ")}` : ""} - ${subCommand.description}`);
      }
    } else {
      if (!categories[category]) categories[category] = [];
      categories[category].push(`**${command}**${params ? ` ${params.join(" ")}` : ""} - ${description}`);
    }
  }
  generated = true;
}

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