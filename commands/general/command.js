import Command from "#cmd-classes/command.js";

class CommandCommand extends Command {
  static description = "Enables/disables a classic command for a server (use server settings for slash commands)";
  static aliases = ["cmd"];
  static slashAllowed = false;
  static directAllowed = false;
  static dbRequired = true;
}

export default CommandCommand;
