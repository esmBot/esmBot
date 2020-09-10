const magick = require("../build/Release/image.node");
const fetch = require("node-fetch");
const { promisify } = require("util");
const FormData = require("form-data");
const fs = require("fs");

module.exports = async (object, fromAPI = false) => {
  if (process.env.API === "true" && !fromAPI) {
    const params = [];
    for (const element of Object.keys(object)) {
      params.push(`${element}=${encodeURIComponent(object[element])}`);
    }
    const form = new FormData();
    form.append("image", fs.createReadStream(object.path));
    const req = await fetch(`${process.env.API_URL}/${object.cmd}?${params.join("&")}`, {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    });
    return object.cmd === "qrread" ? await req.json() : await req.buffer();
  } else {
    const data = await promisify(magick[object.cmd])(object);
    return data;
  }
};