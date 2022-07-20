import * as logger from "../utils/logger.js";
import { readdir, lstat, rm, writeFile } from "fs/promises";

export async function upload(client, result, context, interaction = false) {
  const filename = `${Math.random().toString(36).substring(2, 15)}.${result.name.split(".")[1]}`;
  await writeFile(`${process.env.TEMPDIR}/${filename}`, result.file);
  const imageURL = `${process.env.TMP_DOMAIN || "https://tmp.projectlounge.pw"}/${filename}`;
  const payload = {
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
  };
  if (interaction) {
    await context[context.acknowledged ? "editOriginalMessage" : "createMessage"](payload);
  } else {
    await client.createMessage(context.channel.id, Object.assign(payload, {
      messageReference: {
        channelID: context.channel.id,
        messageID: context.id,
        guildID: context.channel.guild ? context.channel.guild.id : undefined,
        failIfNotExists: false
      },
      allowedMentions: {
        repliedUser: false
      }
    }));
  }
  if (process.env.THRESHOLD) {
    await removeOldImages();
  }
}

export async function removeOldImages() {
  if (process.env.DIRSIZECACHE > process.env.THRESHOLD) {
    const files = (await readdir(process.env.TEMPDIR)).map((file) => {
      return lstat(`${process.env.TEMPDIR}/${file}`).then((stats) => {
        if (stats.isSymbolicLink()) return;
        return {
          name: file,
          size: stats.size,
          ctime: stats.ctime
        };
      });
    }).filter(Boolean);
    const resolvedFiles = await Promise.all(files);
    process.env.DIRSIZECACHE = resolvedFiles.reduce((a, b)=>{
      return a.size + b.size;
    }, 0);
    const oldestFiles = resolvedFiles.sort((a, b) => a.ctime - b.ctime);
    while (process.env.DIRSIZECACHE > process.env.THRESHOLD) {
      await rm(`${process.env.TEMPDIR}/${oldestFiles[0].name}`);
      process.env.DIRSIZECACHE -= oldestFiles[0].size;
      logger.log(`Removed oldest image file: ${oldestFiles[0].name}`);
      oldestFiles.shift();
    }
  }
}