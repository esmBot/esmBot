const urlRegex = /(?:\w+:)?\/\/(\S+)/;
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fetch = require("node-fetch");

exports.run = async (message, args) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, only the bot owner can run this command!`;
  message.channel.sendTyping();
  if (args.length === 0) return `${message.author.mention}, you need to provide a URL to screenshot!`;
  const getEndpoint = await fetch(`http://${process.env.CHROME}/json/version`);
  const endpoint = await getEndpoint.json();
  const url = urlRegex.test(args[0]) ? args[0] : `http://${args[0]}`;
  const browser = await puppeteer.connect({
    browserWSEndpoint: endpoint.webSocketDebuggerUrl,
    defaultViewport: {
      width: 1280,
      height: 720
    }
  });
  const page = await browser.newPage();
  await page.goto(url);
  const screenshot = await page.screenshot();
  await page.close();
  return {
    file: screenshot,
    name: "screenshot.png"
  };
};

exports.aliases = ["webshot", "ss", "shot", "page"];
exports.category = 8;
exports.help = "Screenshots a webpage";