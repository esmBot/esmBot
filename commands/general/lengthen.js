import urlCheck from "../../utils/urlcheck.js";
import fetch from "node-fetch";
import Command from "../../classes/command.js";

class LengthenCommand extends Command {
  async run() {
    this.acknowledge();
    if (this.args.length === 0 || !urlCheck(this.args[0])) return "You need to provide a short URL to lengthen!";
    if (urlCheck(this.args[0])) {
      const url = await fetch(encodeURI(this.args[0]), { redirect: "manual" });
      return url.headers.get("location") || this.args[0];
    } else {
      return "That isn't a URL!";
    }
  }

  static description = "Lengthens a short URL";
  static aliases = ["longurl", "lengthenurl", "longuri", "lengthenuri", "unshorten"];
  static arguments = ["[url]"];
}

export default LengthenCommand;