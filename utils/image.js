const magick = require("../build/Release/image.node");
const fetch = require("node-fetch");
const { promisify } = require("util");
const FormData = require("form-data");
const { readFile } = require("fs").promises;

module.exports = async (object) => {
  if (process.env.API === "true") {
    const params = [];
    for (const element of Object.keys(object)) {
      params.push(`${element}=${object[element]}`);
    }
    const form = new FormData();
    const data = await readFile(object.path);
    form.append("image", data);
    const req = await fetch(`${process.env.API_URL}/${object.cmd}?${params.join("&")}`, {
      method: "POST",
      body: form
    });
    return await req.buffer();
  } else {
    const data = await promisify(magick[object.cmd])(object);
    return data;
  }
};