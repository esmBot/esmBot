const ReactionCollector = require("./awaitreactions.js");
const MessageCollector = require("./awaitmessages.js");
const client = require("../client.js");

const paginationEmbed = async (message, pages, timeout = 120000) => {
  const manageMessages = message.channel.guild.members.get(client.user.id).permission.has("manageMessages") || message.channel.permissionsOf(client.user.id).has("manageMessages") ? true : false;
  let page = 0;
  pages[page].embed.footer.text = `Page ${page + 1} of ${pages.length}`;
  const currentPage = await message.channel.createMessage(pages[page]);
  const emojiList = ["◀", "🔢", "▶", "🗑"];
  for (const emoji of emojiList) {
    await currentPage.addReaction(emoji);
  }
  const reactionCollector = new ReactionCollector(currentPage, (message, reaction, user) => emojiList.includes(reaction.name) && !client.users.get(user).bot, { time: timeout });
  reactionCollector.on("reaction", (msg, reaction, userID) => {
    if (userID === message.author.id) {
      switch (reaction.name) {
        case "◀":
          page = page > 0 ? --page : pages.length - 1;
          pages[page].embed.footer.text = `Page ${page + 1} of ${pages.length}`;
          currentPage.edit(pages[page]);
          if (manageMessages) msg.removeReaction("◀", userID);
          break;
        case "🔢":
          message.channel.createMessage(`${message.author.mention}, what page do you want to jump to?`).then(askMessage => {
            const messageCollector = new MessageCollector(askMessage.channel, (response) => response.author.id === message.author.id && !isNaN(response.content) && Number(response.content) <= pages.length, {
              time: timeout,
              maxMatches: 1
            });
            return messageCollector.on("message", response => {
              askMessage.delete();
              page = Number(response.content) - 1;
              pages[page].embed.footer.text = `Page ${page + 1} of ${pages.length}`;
              currentPage.edit(pages[page]);
              if (manageMessages) msg.removeReaction("🔢", userID);
            });
          }).catch(error => {
            if (error) console.error;
          });
          break;
        case "▶":
          page = page + 1 < pages.length ? ++page : 0;
          pages[page].embed.footer.text = `Page ${page + 1} of ${pages.length}`;
          currentPage.edit(pages[page]);
          if (manageMessages) msg.removeReaction("▶", userID);
          break;
        case "🗑":
          currentPage.delete();
          return;
        default:
          break;
      }
    }
  });
  reactionCollector.on("end", () => {
    try {
      currentPage.removeReactions();
    } catch (e) {
      console.log("Reaction message was deleted");
    }
  });
  return currentPage;
};
module.exports = paginationEmbed;
