# esmBot Image API
The esmBot image API is a combined HTTP and WebSocket API running on port 3762. The API supports very basic authentication, which is defined on the server via the PASS environment variable and is sent from the client via the Authentication header in both HTTP and WS requests.

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
- Rinit tag[2] max_jobs[2] formats[j]
