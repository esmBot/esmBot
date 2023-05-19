import * as logger from "../utils/logger.js";
import { readdir, lstat, rm, writeFile, stat } from "fs/promises";

let dirSizeCache;

export async function upload(client, result, context, interaction = false) {
  const filename = `${Math.random().toString(36).substring(2, 15)}.${result.name.split(".")[1]}`;
  await writeFile(`${process.env.TEMPDIR}/${filename}`, result.contents);
  const imageURL = `${process.env.TMP_DOMAIN || "https://tmp.esmbot.net"}/${filename}`;
  const payload = {
    embeds: [{
      color: 16711680,
      title: "Here's your image!",
      url: imageURL,
      image: {
        url: imageURL
      },
      footer: {
        text: "The result image was more than 25MB in size, so it was uploaded to an external site instead."
      },
    }]
  };
  if (interaction) {
    await context[context.acknowledged ? "editOriginal" : "createMessage"](payload);
  } else {
    await client.rest.channels.createMessage(context.channelID, Object.assign(payload, {
      messageReference: {
        channelID: context.channelID,
        messageID: context.id,
        guildID: context.guildID ?? undefined,
        failIfNotExists: false
      },
      allowedMentions: {
        repliedUser: false
      }
    }));
  }
  if (process.env.THRESHOLD) {
    const size = dirSizeCache + result.contents.length;
    dirSizeCache = size;
    await removeOldImages(size);
  }
}

async function removeOldImages(size) {
  if (size > process.env.THRESHOLD) {
    const files = (await readdir(process.env.TEMPDIR)).map((file) => {
      return lstat(`${process.env.TEMPDIR}/${file}`).then((stats) => {
        if (stats.isSymbolicLink()) return;
        return {
          name: file,
          size: stats.size,
          ctime: stats.ctime
        };
      });
    });
    
    const resolvedFiles = await Promise.all(files);
    const oldestFiles = resolvedFiles.filter(Boolean).sort((a, b) => a.ctime - b.ctime);

    do {
      if (!oldestFiles[0]) break;
      await rm(`${process.env.TEMPDIR}/${oldestFiles[0].name}`);
      logger.log(`Removed oldest image file: ${oldestFiles[0].name}`);
      size -= oldestFiles[0].size;
      oldestFiles.shift();
    } while (size > process.env.THRESHOLD);

    const newSize = oldestFiles.reduce((a, b) => {
      return a + b.size;
    }, 0);
    dirSizeCache = newSize;
  }
}

export async function parseThreshold() {
  const matched = process.env.THRESHOLD.match(/(\d+)([KMGT])/);
  const sizes = {
    K: 1024,
    M: 1048576,
    G: 1073741824,
    T: 1099511627776
  };
  if (matched && matched[1] && matched[2]) {
    process.env.THRESHOLD = matched[1] * sizes[matched[2]];
  } else {
    logger.error("Invalid THRESHOLD config.");
    process.env.THRESHOLD = undefined;
  }
  const dirstat = (await readdir(process.env.TEMPDIR)).map((file) => {
    return stat(`${process.env.TEMPDIR}/${file}`).then((stats) => stats.size);
  });
  const size = await Promise.all(dirstat);
  const reduced = size.reduce((a, b) => {
    return a + b;
  }, 0);
  dirSizeCache = reduced;
}
