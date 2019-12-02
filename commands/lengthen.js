const urlCheck = require("../utils/urlcheck.js");
const fetch = require("node-fetch");

exports.run = async (message, args) => {
  message.channel.sendTyping();
  if (args.length === 0 || !urlCheck(args[0])) return `${message.author.mention}, you need to provide a short URL to lengthen!`;
  if (urlCheck(args[0])) {
    const url = await fetch(args[0], { redirect: "manual" });
    return url.headers.get("location") || args[0];
  }
};

exports.aliases = ["longurl", "lengthenurl", "longuri", "lengthenuri", "unshorten"];
exports.category = 1;
exports.help = "Lengthens a short URL";