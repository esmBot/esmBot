// database stuff
const Enmap = require("enmap");
const settings = new Enmap({ name: "settings" });
exports.settings = settings;
const tags = new Enmap({ name: "tags" });
exports.tags = tags;
