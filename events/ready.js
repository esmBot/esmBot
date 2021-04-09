const database = require("../utils/database.js");
const logger = require("../utils/logger.js");
const messages = require("../messages.json");
const misc = require("../utils/misc.js");
const soundPlayer = require("../utils/soundplayer.js");
const helpGenerator =
  process.env.OUTPUT !== "" ? require("../utils/help.js") : null;
const first = process.env.PMTWO === "true" ? process.env.NODE_APP_INSTANCE === "0" : true;

// run when ready
module.exports = async (client) => {
  // connect to lavalink
  if (!soundPlayer.status && !soundPlayer.connected) await soundPlayer.connect(client);

  await database.setup();

  // generate docs
  if (helpGenerator && first) {
    await helpGenerator.generateList();
    await helpGenerator.createPage(process.env.OUTPUT);
  }

  // set activity (a.k.a. the gamer code)
  (async function activityChanger() {
    client.editStatus("dnd", {
      name: `${misc.random(messages)} | @${client.user.username} help`,
    });
    setTimeout(activityChanger, 900000);
  })();

  if (process.env.PMTWO === "true") process.send("ready");
  logger.log(`Successfully started ${client.user.username}#${client.user.discriminator} with ${client.users.size} users in ${client.guilds.size} servers.`);
};
