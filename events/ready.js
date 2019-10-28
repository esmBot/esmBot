const client = require("../utils/client.js");
const database = require("../utils/database.js");
const logger = require("../utils/logger.js");
const config = require("../config.json");
const misc = require("../utils/misc.js");

// run when ready
module.exports = async () => {
  // make sure settings/tags exist
  for (const guild of client.guilds) {
    const guildDB = (await database.find({ id: guild.id }).exec())[0];
    if (!guildDB) {
      console.log(`Registering database entry for ${guild.id}...`);
      const newGuild = new database({
        id: guild.id,
        tags: misc.tagDefaults,
        prefix: "&"
      });
      await newGuild.save();
    }
  }

  // set activity (a.k.a. the gamer code)
  (async function activityChanger() {
    client.editStatus("dnd", { name: `${misc.random(config.activityMessages)} | @esmBot help` });
    setTimeout(activityChanger, 900000);
  })();

  logger.log("info", `Successfully started ${client.user.username}#${client.user.discriminator} with ${client.users.size} users in ${client.guilds.size} servers.`);
};
