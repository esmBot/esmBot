export default (str) => {
  var regexString = ".{1,15}([\\s\u200B]+|$)|[^\\s\u200B]+?([\\s\u200B]+|$)";
  var re = new RegExp(regexString, "g");
  var lines = str.match(re) || [];
  var result = lines.map((line) => {
    if (line.slice(-1) === "\n") {
      line = line.slice(0, line.length - 1);
    }
    return line;
  }).join("\n");
  return result;
};