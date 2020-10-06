const magick = require("../build/Release/image.node");
const fetch = require("node-fetch");
const { promisify } = require("util");
const FormData = require("form-data");
const fs = require("fs");

exports.run = async (object, fromAPI = false) => {
  if (process.env.API === "true" && !fromAPI) {
    const form = new FormData();
    form.append("data", JSON.stringify(object));
    if (object.path) form.append("image", fs.createReadStream(object.path));
    const req = await fetch(`${process.env.API_URL}/run`, {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    });
    return await req.buffer();
  } else {
    const data = await promisify(magick[object.cmd])(object);
    return data;
  }
};

exports.check = (cmd) => {
  return magick[cmd] ? true : false;
};