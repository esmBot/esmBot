# Config
esmBot uses a mix of environment variables and JSON for configuration.

## Environment Variables (.env)
To make managing environment variables easier, an example `.env` file is included with the bot at `.env.example` and can be used to load the variables on startup.

### Required
- `NODE_ENV`: Used for tuning the bot to different environments. If you don't know what to set it to, leave it as is.
- `TOKEN`: Your bot's token. You can find this [here](https://discord.com/developers/applications) under your application's Bot tab.
- `DB`: The database connection string. By default the `sqlite` and `postgresql` protocols are available, but this can be expanded by putting proper DB driver scripts into `utils/database/`.
- `OWNER`: Your Discord user ID. This is used for granting yourself access to certain management commands. Adding multiple users is supported by separating the IDs with a comma; however, this is not recommended for security purposes.
- `PREFIX`: The bot's default command prefix for classic commands. Note that servers can set their own individual prefixes via the `prefix` command.

### Optional
These variables that are not necessarily required for the bot to run, but can greatly enhance its functionality:

- `STAYVC`: Set this to true if you want the bot to stay in voice chat after playing music/a sound effect. You can make it leave by using the stop command.
- `TENOR`: An API token from [Tenor](https://tenor.com/gifapi). This is required for using GIFs from Tenor.
- `OUTPUT`: A directory to output the help documentation in Markdown format to. It's recommended to set this to a directory being served by a web server.
- `TEMPDIR`: A directory that will store generated images larger than 25MB. It's recommended to set this to a directory being served by a web server.
- `TMP_DOMAIN`: The root domain/directory that the images larger than 25MB are stored at. Example: `https://projectlounge.pw/tmp`
- `THRESHOLD`: A filesize threshold that the bot will start deleting old files in `TEMPDIR` at.
- `METRICS`: The HTTP port to serve [Prometheus](https://prometheus.io/)-compatible metrics on.
- `API_TYPE`: Set this to "none" if you want to process all images locally. Alternatively, set it to "ws" to use an image API server specified in the `image` block of `config/servers.json`.
- `ADMIN_SERVER`: A Discord server/guild ID to limit owner-only commands such as eval to.

## JSON
The JSON-based configuration files are located in `config/`.

### commands.json
```js
{
  "types": {
    "classic": false, // Enable/disable "classic" (prefixed) commands, note that classic commands in direct messages will still work
    "application": true // Enable/disable application commands (slash and context menu commands)
  },
  "blacklist": [
    // Names of commands that you don't want the bot to load
  ]
}
```

### messages.json
```js
{
  "emotes": [
    // Discord emote strings to use in the "Processing... this may take a while" messages, e.g. "<a:processing:818243325891051581>" or "⚙️"
  ],
  "messages": [
    // Strings to use in the bot's activity message/playing status
  ]
}
```

### servers.json
```js
{
  "lava": [ // Objects containing info for connecting to Lavalink audio server(s)
    {
      "name": "test", // A human-friendly name for the server
      "url": "localhost:2333", // IP address/domain name and port for the server
      "auth": "youshallnotpass", // Password/authorization code for the server
      "local": false // Whether or not the esmBot "assets" folder is located next to the Lavalink jar file
    }
  ],
  "image": [ // Objects containing info for connecting to WS image server(s)
    {
      "server": "localhost", // IP address or domain name for the server
      "auth": "verycoolpass100", // Password/authorization code for the server
      "tls": false // Whether or not this is a secure TLS/wss connection
    }
  ],
  "searx": [
    // URLs for Searx/SearXNG instances used for image/YouTube searches, e.g. "https://searx.projectlounge.pw"
    // Note: instances must support getting results over JSON
  ]
}
```
