import TagsGetCommand from "./tags/get";

class TagsCommand extends TagsGetCommand {
  static description = "The main tags command. Check the help page for more info: https://esmbot.net/help.html";
  static aliases = ["t", "tag", "ta"];
}

export default TagsCommand;
