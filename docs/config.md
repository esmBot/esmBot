# Config
esmBot uses environment variables for configuration. To make managing them easier, a `.env` file is included with the bot and can be used to load the variables on bot startup.

Here's an overview of the environment variables required to run the bot:
- `NODE_ENV`: Used for tuning the bot to different environments. If you don't know what to set it to, leave it as is.
- `TOKEN`: Your bot's token. You can find this at https://discord.com/developers/applications under your application's Bot tab.
- `DB`: The database connection string. By default the `sqlite` and `postgresql` protocols are available, but this can be expanded by putting proper DB driver scripts into `utils/database/`. You can also set this to `dummy` to make the bot not use a database at all.
- `OWNER`: Your Discord user ID. This is used for granting yourself access to certain management commands. Adding multiple users is supported by separating the IDs with a comma; however, this is not recommended for security purposes.
- `PREFIX`: The bot's default command prefix. Note that servers can set their own individual prefixes via the `prefix` command.

Here's an overview of the variables that are not necessarily required for the bot to run, but can greatly enhance its functionality:
- `STAYVC`: Set this to true if you want the bot to stay in voice chat after playing music/a sound effect. You can make it leave by using the stop command.
- `DBL`: An API token from [Top.gg](https://top.gg/). Unnecessary for most users since Top.gg tends to ban forks of bots like esmBot from their list.
- `TENOR`: An API token from [Tenor](https://tenor.com/gifapi). This is not required for using GIFs from Tenor; however, it can greatly reduce resource usage from converting said GIFs.
- `OUTPUT`: A directory to output the help documentation in Markdown format to. It's recommended to set this to a directory being served by a web server.
- `TEMPDIR`: A directory that will store generated images larger than 8MB. It's recommended to set this to a directory being served by a web server.
- `TMP_DOMAIN`: The root domain/directory that the images larger than 8MB are stored at. Example: `https://projectlounge.pw/tmp`
- `METRICS`: The HTTP port to serve [Prometheus](https://prometheus.io/)-compatible metrics on.
- `API`: Set this to true if you plan on using the image API. Images will be requested from the URLs specified in the `image` block of `servers.json`.