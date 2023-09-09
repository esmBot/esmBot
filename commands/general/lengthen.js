import urlCheck from "../../utils/urlcheck.js";
import Command from "../../classes/command.js";

class LengthenCommand extends Command {
  async run() {
    await this.acknowledge();
    const input = this.options.url ?? this.args.join(" ");
    this.success = false;
    if (!input || !input.trim() || !urlCheck(input)) return "You need to provide a short URL to lengthen!";
    if (urlCheck(input)) {
      const url = await fetch(encodeURI(input), { method: "HEAD", redirect: "manual" });
      this.success = true;
      return url.headers.get("location") || input;
    } else {
      return "That isn't a URL!";
    }
  }

  static flags = [{
    name: "url",
    type: 3,
    description: "The URL you want to lengthen",
    required: true
  }];

  static description = "Lengthens a short URL";
  static aliases = ["longurl", "lengthenurl", "longuri", "lengthenuri", "unshorten"];
  static arguments = ["[url]"];
}

export default LengthenCommand;