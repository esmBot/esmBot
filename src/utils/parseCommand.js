/**
 * @param {string[] | string} cmd
 */
export default (cmd) => {
  let input = cmd;
  if (typeof input === "string") input = input.split(/\s+/g);
  const args = { _: [] };
  let curr = null;
  let concated = "";
  for (let i = 0; i < input.length; i++) {
    const a = input[i];
    if ((a.startsWith("--") || a.startsWith("—")) && !curr) {
      if (a.includes("=")) {
        const [arg, value] = (a.startsWith("--") ? a.slice(2).split("=") : a.slice(1).split("="));
        let ended = true;
        if (arg !== "_") {
          if (value.startsWith("\"")) {
            if (value.endsWith("\"")) {
              args[arg] = value.slice(1).slice(0, -1);
            } else {
              args[arg] = `${value.slice(1)} `;
              ended = false;
            }
          } else if (value.endsWith("\"")) {
            args[arg] += a.slice(0, -1);
          } else if (value !== "") {
            args[arg] = value;
          } else {
            args[arg] = true;
          }
          if (args[arg] === "true") {
            args[arg] = true;
          } else if (args[arg] === "false") {
            args[arg] = false;
          }
          if (!ended) curr = arg;
        }
      } else {
        args[a.slice(2)] = true;
      }
    } else if (curr) {
      if (a.endsWith("\"")) {
        args[curr] += a.slice(0, -1);
        curr = null;
      } else {
        args[curr] += `${a} `;
      }
    } else {
      if (concated !== "") {
        concated += `${a} `;
      } else {
        args._.push(a);
      }
    }
  }

  if (curr && args[curr] === "") {
    args[curr] = true;
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
