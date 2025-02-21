import { lstat, readdir, rm, stat, writeFile } from "node:fs/promises";
import { type Client, CommandInteraction, type File, type Message } from "oceanic.js";
import { getString } from "./i18n.js";
import logger from "./logger.js";

type SizeSuffix = "K" | "M" | "G" | "T";
type FileStats = {
  name: string;
  size: number;
  ctime: Date;
};

let dirSizeCache: number;
let threshold: number | undefined;

export async function upload(client: Client, result: { flags?: number; } & File, context: CommandInteraction | Message, success = true) {
  const filename = `${Math.random().toString(36).substring(2, 15)}.${result.name.split(".")[1]}`;
  await writeFile(`${process.env.TEMPDIR}/${filename}`, result.contents);
  const imageURL = `${process.env.TMP_DOMAIN || "https://tmp.esmbot.net"}/${filename}`;
  const payload = result.name.startsWith("SPOILER_") ? {
    content: `${getString("image.tempSite", { locale: context instanceof CommandInteraction ? context.locale : undefined })}\n|| ${imageURL} ||`,
    flags: result.flags ?? (success ? 0 : 64)
  } : {
    embeds: [{
      color: 0xff0000,
      title: getString("image.tempImageSent", { locale: context instanceof CommandInteraction ? context.locale : undefined }),
      url: imageURL,
      image: {
        url: imageURL
      },
      footer: {
        text: getString("image.tempSite", { locale: context instanceof CommandInteraction ? context.locale : undefined })
      },
    }],
    flags: result.flags ?? (success ? 0 : 64)
  };
  if (context instanceof CommandInteraction) {
    await context.createFollowup(payload);
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
  if (threshold) {
    const size = dirSizeCache + result.contents.length;
    dirSizeCache = size;
    await removeOldImages(size);
  }
}

async function removeOldImages(s: number) {
  if (!threshold) return;
  if (!process.env.TEMPDIR || process.env.TEMPDIR === "") return;
  let size = s;
  if (size > threshold) {
    const files = (await readdir(process.env.TEMPDIR)).map(async (file) => {
      const stats = await lstat(`${process.env.TEMPDIR}/${file}`);
      if (stats.isSymbolicLink()) return;
      return {
        name: file,
        size: stats.size,
        ctime: stats.ctime
      } as FileStats;
    });
    
    const resolvedFiles = await Promise.all(files);
    const oldestFiles = resolvedFiles.filter((item): item is FileStats => !!item).sort((a, b) => a.ctime.getTime() - b.ctime.getTime());

    do {
      if (!oldestFiles[0]) break;
      await rm(`${process.env.TEMPDIR}/${oldestFiles[0].name}`);
      logger.log(`Removed oldest image file: ${oldestFiles[0].name}`);
      size -= oldestFiles[0].size;
      oldestFiles.shift();
    } while (size > threshold);

    const newSize = oldestFiles.reduce((a, b) => {
      return a + b.size;
    }, 0);
    dirSizeCache = newSize;
  }
}

export async function parseThreshold() {
  if (!process.env.THRESHOLD || process.env.THRESHOLD === "") return;
  if (!process.env.TEMPDIR || process.env.TEMPDIR === "") return;
  const matched = process.env.THRESHOLD.match(/(\d+)([KMGT])/);
  const sizes = {
    K: 1024,
    M: 1048576,
    G: 1073741824,
    T: 1099511627776
  };
  if (matched?.[1] && matched[2]) {
    threshold = Number(matched[1]) * sizes[matched[2] as SizeSuffix];
  } else {
    logger.error("Invalid THRESHOLD config.");
    threshold = undefined;
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
