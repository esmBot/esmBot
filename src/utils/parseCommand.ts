type Args = {
  args: string[];
  flags: {
    [key: string]: string | boolean | number;
  };
};

export default (cmd: string[] | string) => {
  let input = cmd;
  if (typeof input === "string") input = input.split(/\s+/g);
  const args: Args = { args: [], flags: {} };
  let curr = null;
  let concated = "";
  for (let i = 0; i < input.length; i++) {
    const a = input[i];
    if ((a.startsWith("--") || a.startsWith("—")) && !curr) {
      if (a.includes("=")) {
        const [arg, value] = a.startsWith("--") ? a.slice(2).split("=") : a.slice(1).split("=");
        let ended = true;
        if (arg !== "args") {
          if (value.startsWith('"')) {
            if (value.endsWith('"')) {
              args.flags[arg] = value.slice(1).slice(0, -1);
            } else {
              args.flags[arg] = `${value.slice(1)} `;
              ended = false;
            }
          } else if (value.endsWith('"')) {
            args.flags[arg] += a.slice(0, -1);
          } else if (value !== "") {
            args.flags[arg] = value;
          } else {
            args.flags[arg] = true;
          }
          if (args.flags[arg] === "true") {
            args.flags[arg] = true;
          } else if (args.flags[arg] === "false") {
            args.flags[arg] = false;
          }
          if (!ended) curr = arg;
        }
      } else {
        args.flags[a.slice(2)] = true;
      }
    } else if (curr) {
      if (a.endsWith('"')) {
        args.flags[curr] += a.slice(0, -1);
        curr = null;
      } else {
        args.flags[curr] += `${a} `;
      }
    } else {
      if (concated !== "") {
        concated += `${a} `;
      } else {
        args.args.push(a);
      }
    }
  }

  if (curr && args.flags[curr] === "") {
    args.flags[curr] = true;
  }

  return args;
};

// /*
// Format:
// [{name: "verbose", type: "bool"}, {name: "username", type: "string"}]
// */
// export default (input, format) => {
//     let results = {};
//     let text = input.split(' ').slice(1).join(' ');
//     format.forEach(element => {
//         if(element.pos !== undefined) return;
//         switch (element.type) {
//             case "bool":
//                 res = text.match(`--${element.name}[ |=](.*?)($| )`);
//                 if(res) {
//                     text = text.replace(res[0], "");
//                     results[element.name] = (res[1].toLowerCase() == "true");
//                 } else {
//                     res = text.match(`--${element.name}`);
//                     if(res) text = text.replace(res[0], "");
//                     results[element.name] = (res != null);
//                 }
//                 break;
//             case "string":
//                 res = text.match(`--${element.name}[ |=](.*?)($| )`);
//                 if(res) text = text.replace(res[0], "");
//                 results[element.name] = (res ? res[1].replace('\\','') : null);
//                 break;
//             case "int":
//                 res = text.match(`--${element.name}[ |=](.*?)($| )`);
//                 if(res) text = text.replace(res[0], "");
//                 results[element.name] = (res ? parseInt(res[1]) : null);
//                 break;
//             case "float":
//                 res = text.match(`--${element.name}[ |=](.*?)($| )`);
//                 if(res) text = text.replace(res[0], "");
//                 results[element.name] = (res ? parseFloat(res[1]) : null);
//                 break;
//             default:
//                 throw Error("unknown type");
//                 break;
//         }
//     });
//     let s = text.split(' ');
//     results._ = text;
//     format.forEach(element => {
//         if(element.pos === undefined) return;
//         if(element.pos <= s.length) {
//             results[element.name] = s[element.pos];
//         } else {
//             results[element.name] = null;
//         }
//     })
//     return results;
// }
