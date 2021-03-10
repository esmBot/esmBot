class Command {
  constructor(message, args, content) {
    this.message = message;
    this.args = args;
    this.content = content;
  }

  async run() {
    return "It works!";
  }

  static description = "No description found";
  static aliases = [];
  static arguments = [];
  static requires = [];
}

module.exports = Command;