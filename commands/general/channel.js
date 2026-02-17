import Command from "#cmd-classes/command.js";

class ChannelCommand extends Command {
  static description = "Enables/disables classic commands in a channel (use server settings for slash commands)";
  static slashAllowed = false;
  static directAllowed = false;
  static dbRequired = true;
}

export default ChannelCommand;
