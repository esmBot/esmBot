import TagsGetCommand from "./get.js";

class TagsRoleCommand extends TagsGetCommand {
  static description = "Manage role permissions for tags";
  static tag = "role";
}

export default TagsRoleCommand;
