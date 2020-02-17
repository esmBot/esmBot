const urlRegex = /(?:\w+:)?\/\/(\S+)/;
const puppeteer = require("puppeteer-core");
const fetch = require("node-fetch");

exports.run = async (message, args) => {
  message.channel.sendTyping();
  if (args.length === 0) return `${message.author.mention}, you need to provide a URL to screenshot!`;
  const getEndpoint = await fetch("http://192.168.99.100:9222/json/version");
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
  return message.channel.createMessage("", {
    file: screenshot,
    name: "screenshot.png"
  });
};

exports.aliases = ["webshot", "ss", "shot", "page"];
exports.category = 5;
exports.help = "Screenshots a webpage";