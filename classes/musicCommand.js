const Command = require("./command");
const soundPlayer = require("../utils/soundplayer");

class MusicCommand extends Command {
  constructor(client, message, args, content) {
    super(client, message, args, content);
    this.connection = soundPlayer.players.get(message.channel.guild.id);
  }

  static requires = ["sound"];
}

module.exports = MusicCommand;