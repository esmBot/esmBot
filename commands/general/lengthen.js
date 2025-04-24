import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class LengthenCommand extends Command {
  async run() {
    await this.acknowledge();
    const input = this.getOptionString("url") ?? this.args.join(" ");
    this.success = false;
    if (!input || !input.trim() || !this.urlCheck(input)) return this.getString("commands.responses.lengthen.noInput");
    if (this.urlCheck(input)) {
      const url = await fetch(encodeURI(input), { method: "HEAD", redirect: "manual" });
      this.success = true;
      return url.headers.get("location") || input;
    }
    return this.getString("commands.responses.lengthen.notURL");
  }

  /**
   * @param {string} string
   */
  urlCheck(string) {
    const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;
    const domainRE = /^[^\s.]+\.\S{2,}$/;
    const match = string.match(protocolAndDomainRE);
    if (!match) {
      return false;
    }
    const everythingAfterProtocol = match[1];
    if (!everythingAfterProtocol) {
      return false;
    }
    if (domainRE.test(everythingAfterProtocol)) {
      return true;
    }
    return false;
  }

  static flags = [
    {
      name: "url",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The URL you want to lengthen",
      classic: true,
      required: true,
    },
  ];

  static description = "Lengthens a short URL";
  static aliases = ["longurl", "lengthenurl", "longuri", "lengthenuri", "unshorten"];
}

export default LengthenCommand;
