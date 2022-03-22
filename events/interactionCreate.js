import { promises } from "fs";
import database from "../utils/database.js";
import * as logger from "../utils/logger.js";
import { commands } from "../utils/collections.js";
import { CommandInteraction } from "eris";
import { clean } from "../utils/misc.js";

// run when a slash command is executed
export default async (client, cluster, worker, ipc, interaction) => {
  if (!(interaction instanceof CommandInteraction)) return;

  // check if command exists and if it's enabled
  const command = interaction.data.name;
  const cmd = commands.get(command);
  if (!cmd) return;

  const invoker = interaction.member ?? interaction.user;

  // actually run the command
  logger.log("log", `${invoker.username} (${invoker.id}) ran command ${command}`);
  try {
    await database.addCount(command);
    // eslint-disable-next-line no-unused-vars
    const commandClass = new cmd(client, cluster, worker, ipc, { type: "application", interaction });
    const result = await commandClass.run();
    if (typeof result === "string" || (typeof result === "object" && result.embeds)) {
      await interaction.createMessage(result);
    } else if (typeof result === "object" && result.file) {
      let fileSize = 8388119;
      if (interaction.channel.guild) {
        switch (interaction.channel.guild.premiumTier) {
          case 2:
            fileSize = 52428308;
            break;
          case 3:
            fileSize = 104856616;
            break;
        }
      }
      if (result.file.length > fileSize) {
        if (process.env.TEMPDIR && process.env.TEMPDIR !== "") {
          const filename = `${Math.random().toString(36).substring(2, 15)}.${result.name.split(".")[1]}`;
          await promises.writeFile(`${process.env.TEMPDIR}/${filename}`, result.file);
          const imageURL = `${process.env.TMP_DOMAIN || "https://tmp.projectlounge.pw"}/${filename}`;
          await interaction.createMessage({
            embeds: [{
              color: 16711680,
              title: "Here's your image!",
              url: imageURL,
              image: {
                url: imageURL
              },
              footer: {
                text: "The result image was more than 8MB in size, so it was uploaded to an external site instead."
              },
            }]
          });
        } else {
          await interaction.createMessage("The resulting image was more than 8MB in size, so I can't upload it.");
        }
      } else {
        await interaction.createMessage({
          content: result.text ? result.text : undefined
        }, result);
      }
    }
  } catch (error) {
    if (error.toString().includes("Request entity too large")) {
      await interaction.createMessage("The resulting file was too large to upload. Try again with a smaller image if possible.");
    } else if (error.toString().includes("Job ended prematurely")) {
      await interaction.createMessage("Something happened to the image servers before I could receive the image. Try running your command again.");
    } else if (error.toString().includes("Timed out")) {
      await interaction.createMessage("The request timed out before I could download that image. Try uploading your image somewhere else or reducing its size.");
    } else {
      logger.error(`Error occurred with slash command ${command} with arguments ${interaction.data.options}: ${error.toString()}`);
      try {
        await interaction.createMessage({
          content: "Uh oh! I ran into an error while running this command. Please report the content of the attached file at the following link or on the esmBot Support server: <https://github.com/esmBot/esmBot/issues>"
        }, [{
          file: `Message: ${await clean(error)}\n\nStack Trace: ${await clean(error.stack)}`,
          name: "error.txt"
        }]);
      } catch { /* silently ignore */ }
    }
  }
};
