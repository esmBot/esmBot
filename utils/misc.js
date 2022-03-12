import util from "util";
import fs from "fs";
import { config } from "dotenv";

// random(array) to select a random entry in array
export function random(array) {
  if (!array || array.length < 1) return null;
  return array[Math.floor(Math.random() * array.length)];
}

const optionalReplace = (token) => {
  return token === undefined || token === "" ? "" : (token === "true" || token === "false" ? token : "<redacted>");
};

// clean(text) to clean message of any private info or mentions
export async function clean(text) {
  if (text && text.constructor && text.constructor.name == "Promise")
    text = await text;
  if (typeof text !== "string")
    text = util.inspect(text, { depth: 1 });

  text = text
    .replaceAll("`", `\`${String.fromCharCode(8203)}`)
    .replaceAll("@", `@${String.fromCharCode(8203)}`);

  const { parsed } = config();
  const imageServers = JSON.parse(fs.readFileSync(new URL("../servers.json", import.meta.url), { encoding: "utf8" })).image;

  if (imageServers && imageServers.length !== 0) {
    for (const { server, auth } of imageServers) {
      text = text.replaceAll(server, optionalReplace(server));
      text = text.replaceAll(auth, optionalReplace(auth));
    }
  }

  for (const env of Object.keys(parsed)) {
    text = text.replaceAll(parsed[env], optionalReplace(parsed[env]));
  }

  return text;
}

// regexEscape(string) to escape characters in a string for use in a regex
export function regexEscape(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

// decodeEntities(string)
export function decodeEntities(string) {
  var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
  var translate = {
    "nbsp": " ",
    "amp": "&",
    "quot": "\"",
    "lt": "<",
    "gt": ">"
  };
  return string.replace(translate_re, function(match, entity) {
    return translate[entity];
  }).replace(/&#(\d+);/gi, function(match, numStr) {
    var num = parseInt(numStr, 10);
    return String.fromCharCode(num);
  });
}
