const fetch = require("node-fetch");

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate a Minecraft achievement!`;
  message.channel.sendTyping();
  const request = await fetch(`https://www.minecraftskinstealer.com/achievement/a.php?i=13&h=Achievement+get%21&t=${encodeURIComponent(args.join("+"))}`);
  return {
    file: await request.buffer(),
    name: "mc.png"
  };
};

exports.aliases = ["ach", "achievement", "minecraft"];
exports.category = 4;
exports.help = "Generates a Minecraft achievement image";
exports.params = "[text]";