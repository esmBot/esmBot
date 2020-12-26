module.exports = (input) => {
    input = input.split(" ");
    let args = {_: []};
    let curr = null;
    let cont = false;
    for (let i = 0; i < input.length; i++) {
        const a = input[i];
        if(a.startsWith('--')) {
            if(curr) {
                args[curr] = true;
            }
            args[a.slice(2)] = "";
            curr = a.slice(2);
        } else if(curr) {        
            if(a.startsWith('"')) {            
                args[curr] = a.slice(1)+" ";
            } else if(a.endsWith('"')) {
                            
                args[curr] += a.slice(0, -1);
                curr = null;
            } else {
                if(args[curr].split(" ").length == 1) {
                    args[curr] += a;
                    curr = null;
                } else {
                    args[curr] += a;
                }
            }
        } else {
            args._.push(a);
        }
    }
    
    if(curr && args[curr] == "") {
        args[curr] = true;
    }

    return args;
}

// /*
// Format: 
// [{name: "verbose", type: "bool"}, {name: "username", type: "string"}]
// */
// module.exports = (input, format) => {
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