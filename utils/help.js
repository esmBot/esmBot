const collections = require("./collections.js");
const fs = require("fs");

const categoryTemplate = {
  general: [],
  tags: ["> **Every command in this category is a subcommand of the tag command.**\n"],
  "image-editing": ["> **These commands support the PNG, JPEG, WEBP (static), and GIF (animated or static) formats.**\n"]
};
exports.categories = categoryTemplate;

exports.generateList = async () => {
  this.categories = categoryTemplate;
  for (const [command] of collections.commands) {
    const category = collections.info.get(command).category;
    const description = collections.info.get(command).description;
    const params = collections.info.get(command).params;
    if (category === "tags") {
      const subCommands = [...Object.keys(description)];
      for (const subCommand of subCommands) {
        this.categories.tags.push(`**tags${subCommand !== "default" ? ` ${subCommand}` : ""}**${params[subCommand] ? ` ${params[subCommand]}` : ""} - ${description[subCommand]}`);
      }
    } else {
      if (!this.categories[category]) this.categories[category] = [];
      this.categories[category].push(`**${command}**${params ? ` ${params}` : ""} - ${description}`);
    }
  }
};

exports.createPage = async (output) => {
  let template = `# <img src="https://raw.githubusercontent.com/esmBot/esmBot/master/esmbot.png" width="64"> esmBot${process.env.NODE_ENV === "development" ? " Dev" : ""} Command List

This page was last generated on \`${new Date().toString()}\`.

\`[]\` means an argument is required, \`{}\` means an argument is optional.

Default prefix is \`&\`.

**Want to help support esmBot's development? Consider donating on Patreon!** https://patreon.com/TheEssem

> Tip: You can get much more info about a command by using \`help [command]\` in the bot itself.
`;

  template += "\n## Table of Contents\n";
  for (const category of Object.keys(this.categories)) {
    const categoryStringArray = category.split("-");
    for (const index of categoryStringArray.keys()) {
      categoryStringArray[index] = categoryStringArray[index].charAt(0).toUpperCase() + categoryStringArray[index].slice(1);
    }
    template += `+ [**${categoryStringArray.join(" ")}**](#${category})\n`;
  }

  // hell
  for (const category of Object.keys(this.categories)) {
    const categoryStringArray = category.split("-");
    for (const index of categoryStringArray.keys()) {
      categoryStringArray[index] = categoryStringArray[index].charAt(0).toUpperCase() + categoryStringArray[index].slice(1);
    }
    template += `\n## ${categoryStringArray.join(" ")}\n`;
    for (const command of this.categories[category]) {
      if (command.startsWith(">")) {
        template += `${command}\n`;
      } else {
        template += `+ ${command}\n`;
      }
    }
  }

  await fs.promises.writeFile(output, template);
};