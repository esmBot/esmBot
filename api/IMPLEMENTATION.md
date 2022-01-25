# esmBot Image API
The esmBot image API is a combined HTTP and WebSocket API. The default port to access the API is 3762. The API supports very basic authentication, which is defined on the server via the PASS environment variable and is sent from the client via the Authentication header in both HTTP and WS requests.

## HTTP

### GET `/image/?id=<job id>`
Get image data after job is finished running. The Content-Type header is properly set.

## WebSockets
A client sends *requests* (T-messages) to a server, which subsequently *replies* (R-messages) to the client.
### Message IDs
- Rerror 0x01
- Tqueue 0x02
- Rqueue 0x03
- Tcancel 0x04
- Rcancel 0x05
- Twait 0x06
- Rwait 0x07
- Rinit 0x08

### Messages
[n] means n bytes.
[s] means a string that goes until the end of the message.
[j] means JSON data that goes until the end of the message.
`tag` is used to identify a request/response pair, like `lock` in the original API. `jid` is used to identify a job. `job` is a job object.
- Rerror tag[2] error[s]
- Tqueue tag[2] jid[4] job[j]
- Rqueue tag[2]
- Tcancel tag[2] jid[4]
- Rcancel tag[2]
- Twait tag[2] jid[4]
- Rwait tag[2]
- Rinit tag[2] max_jobs[2] running_jobs[2] formats[j]

### Job Object
The job object is formatted like this:
```json
{
  "cmd": string,      // name of internal image command, e.g. caption
  "path": string,     // canonical image URL, used for getting the actual image
  "url": string,      // original image URL, used for message filtering
  "params": {         // content varies depending on the command, some common parameters are listed here
    "type": string,   // mime type of output, should usually be the same as input
    "delay": integer, // for manually specifying GIF frame delay, set to 0 to use the default delay
    ...
  }
}
```
