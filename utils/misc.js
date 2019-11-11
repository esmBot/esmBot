// random(array) to select a random entry in array
exports.random = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// clean(text) to clean message of any private info or mentions
exports.clean = async (text) => {
  const config = require("../config.json");
  if (text && text.constructor.name == "Promise")
    text = await text;
  if (typeof evaled !== "string")
    text = require("util").inspect(text, { depth: 1 });

  text = text
    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
    .replace(/@/g, `@${String.fromCharCode(8203)}`)
    .replace(config.token, "<redacted>")
    .replace(config.mashapeKey, "<redacted>")
    .replace(config.catToken, "<redacted>")
    .replace(config.googleKey, "<redacted>")
    .replace(config.cseID, "<redacted>")
    .replace(config.dblToken, "<redacted>")
    .replace(config.mongoURL, "<redacted>");

  return text;
};

// regexEscape(string) to escape characters in a string for use in a regex
exports.regexEscape = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

// define defaults for prefixes and tags
exports.defaults = {
  prefix: "&"
};
exports.tagDefaults = {
  help: {
    content: "https://essem.space/esmBot/commands.html?dev=true",
    author: "198198681982205953"
  }
};
