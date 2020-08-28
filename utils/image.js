const magick = require("../build/Release/image.node");
const { promisify } = require("util");

module.exports = async (object) => {
  const data = await promisify(magick[object.cmd])(object);
  return data;
};