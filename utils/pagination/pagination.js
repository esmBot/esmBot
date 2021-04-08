const ReactionCollector = require("./awaitreactions.js");
const MessageCollector = require("./awaitmessages.js");
const client = require("../client.js");

module.exports = async (message, pages, timeout = 120000) => {
  const manageMessages = message.channel.guild && message.channel.permissionsOf(client.user.id).has("manageMessages") ? true : false;
  let page = 0;
  let currentPage = await message.channel.createMessage(pages[page]);
  const emojiList = ["◀", "🔢", "▶", "🗑"];
  for (const emoji of emojiList) {
    await currentPage.addReaction(emoji);
  }
  const reactionCollector = new ReactionCollector(currentPage, (message, reaction, member) => emojiList.includes(reaction.name) && !member.bot, { time: timeout });
  reactionCollector.on("reaction", async (msg, reaction, member) => {
    if (member.id === message.author.id) {
      switch (reaction.name) {
        case "◀":
          page = page > 0 ? --page : pages.length - 1;
          currentPage = await currentPage.edit(pages[page]);
          if (manageMessages) msg.removeReaction("◀", member.id);
          break;
        case "🔢":
          message.channel.createMessage(`${message.author.mention}, what page do you want to jump to?`).then(askMessage => {
            const messageCollector = new MessageCollector(askMessage.channel, (response) => response.author.id === message.author.id && !isNaN(response.content) && Number(response.content) <= pages.length && Number(response.content) > 0, {
              time: timeout,
              maxMatches: 1
            });
            return messageCollector.on("message", async (response) => {
              if (askMessage.channel.messages.get(askMessage.id)) askMessage.delete();
              if (manageMessages) await response.delete();
              page = Number(response.content) - 1;
              currentPage = await currentPage.edit(pages[page]);
              if (manageMessages) msg.removeReaction("🔢", member.id);
            });
          }).catch(error => {
            throw error;
          });
          break;
        case "▶":
          page = page + 1 < pages.length ? ++page : 0;
          currentPage = await currentPage.edit(pages[page]);
          if (manageMessages) msg.removeReaction("▶", member.id);
          break;
        case "🗑":
          reactionCollector.emit("end");
          if (currentPage.channel.messages.get(currentPage.id)) await currentPage.delete();
          return;
        default:
          break;
      }
    }
  });
  reactionCollector.once("end", async () => {
    try {
      await currentPage.channel.getMessage(currentPage.id);
      if (manageMessages) {
        await currentPage.removeReactions();
      }
    } catch {
      return;
    }
  });
  return currentPage;
};
