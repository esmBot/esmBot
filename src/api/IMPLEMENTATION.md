# esmBot Media API

The esmBot Media API is a combined HTTP and WebSocket API. The default port to access the API is 3762. The API supports very basic authentication, which is defined on the server via the `PASS` environment variable and is sent from the client via the Authentication header in both HTTP and WS requests.

## HTTP

### GET `/media/?id=<job id>`

Get output data after job is finished running. The Content-Type header is properly set.

### GET `/count`

Get the current amount of running jobs. Response is a plaintext number value.

## WebSockets

A client sends _requests_ (T-messages) to a server, which subsequently _replies_ (R-messages) to the client.

### Message IDs

- Rerror 0x01
- Tqueue 0x02
- Rqueue 0x03
- Tcancel 0x04
- Rcancel 0x05
- Twait 0x06
- Rwait 0x07
- Rinit 0x08
- Rsent 0x09
- Rclose 0xFF

### Messages

[n] means n bytes.
[s] means a string that goes until the end of the message.
[j] means JSON data that goes until the end of the message.
`tag` is used to identify a request/response pair. `jid` is used to identify a job. `job` is a job object.

- Rerror tag[2] error[s]
- Tqueue tag[2] jid[8] job[j]
- Rqueue tag[2]
- Tcancel tag[2] jid[8]
- Rcancel tag[2]
- Twait tag[2] jid[8]
- Rwait tag[2]
- Rinit tag[2] max_jobs[2] running_jobs[2] formats[j]
- Rsent tag[2] attachment[j]
- Rclose

### Job Object

The job object is formatted like this:

```js
{
  "type": "image",     // type of job to execute
  "cmd": string,       // name of internal media command, e.g. caption
  "path": string,      // canonical media URL, used for getting the actual input
  "url": string,       // original media URL, used for message filtering
  "params": {          // content varies depending on the command, some common parameters are listed here
    "togif": boolean,  // convert output to gif
    ...
  },
  "input": {
    "type": string     // mime type of output, should usually be the same as input
  },
  "name": string,      // filename of the media file, without extension
  "ephemeral": string, // whether to post the output as an ephemeral message (only when responding directly, see below section)
  "spoiler": string    // whether to post the output as a spoiler (only when responding directly, see below section)
}
```

### Direct Posting

The media API will attempt to respond to a command by itself if all of the following criteria is met:

- The original request was done through an interaction/slash command
- The bot's application/user ID is specified on the API server through the `CLIENT_ID` environment variable
- The incoming job object has an interaction token set in the job object with the key `token`
- The output data is a PNG, JPEG, GIF, WEBP, or AVIF
- The output data is less than 10 MB
