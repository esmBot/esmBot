# Custom Commands
esmBot has a powerful and flexible command handler, allowing you to create new commands and categories simply by creating new files. This page will provide a reference for creating new commands.

## Directory Structure
The bot loads commands from subdirectories inside of the `commands` directory, which looks something like this by default:
```
commands/
  - fun
    > cat.js
    > ...
  - general
    > help.js
    > ping.js
    > ...
  - image-editing
    > caption.js
    > speed.js
    > ...
```
As you can see, each command is grouped into categories, which are represented by subdirectories. To create a new category, you can simply create a new directory inside of the `commands` directory, and to create a new command, you can create a new JS file under one of those subdirectories.

!!! tip
    The `message` category is special; commands in here act as right-click context menu message commands instead of "classic" or slash commands.

## Command Structure
It's recommended to use the `Command` class located in `classes/command.js` to create a new command in most cases. This class provides various parameters and fields that will likely be useful when creating a command. Here is a simple example of a working command file:
```js
import Command from "../../classes/command.js";

class HelloCommand extends Command {
  async run() {
    return "Hello world!";
  }

  static description = "A simple command example";
  static aliases = ["helloworld"];
}

export default HelloCommand;
```
As you can see, the first thing we do is import the Command class. We then create a new class for the command that extends that class to provide the needed parameters. We then define the command function, which is named `run`. Some static parameters, including the command description and an alias for the command, `helloworld`, are also defined. Finally, once everything in the command class is defined, we export the new class to be loaded as a module by the command handler.

The default command name is the same as the filename that you save it as, excluding the `.js` file extension. If you ever want to change the name of the command, just rename the file.

The parameters available to your command consist of the following:

- `this.client`: An instance of an Oceanic [`Client`](https://docs.oceanic.ws/latest/classes/Client.Client.html), useful for getting info or performing lower-level communication with the Discord API.
- `this.origOptions`: The raw options object provided to the command by the command handler.
- `this.type`: The type of message that activated the command. Can be "classic" (a regular message) or "application" (slash/context menu commands).
- `this.channel`: An Oceanic [`TextChannel`](https://docs.oceanic.ws/latest/classes/TextChannel.TextChannel.html) object of the channel that the command was run in, useful for getting info about a server and how to respond to a message. Partial when classic commands are disabled.
- `this.guild`: An Oceanic [`Guild`](https://docs.oceanic.ws/latest/classes/Guild.Guild.html) object of the guild that the command was run in. This is undefined in DMs.
- `this.author`: An Oceanic [`User`](https://docs.oceanic.ws/latest/classes/User.User.html) object of the user who ran the command, or a [`Member`](https://docs.oceanic.ws/latest/classes/Member.Member.html) object identical to `this.member` if run in a server as a slash command.
- `this.member`: An Oceanic [`Member`](https://docs.oceanic.ws/latest/classes/Member.Member.html) object of the server member who ran the command. When running the command outside of a server, this parameter is undefined when run as a "classic" command or a [`User`](https://docs.oceanic.ws/latest/classes/User.User.html) object identical to `this.author` when run as a slash command.
- `this.permissions`: An Oceanic [`Permission`](https://docs.oceanic.ws/latest/classes/Permission.Permission.html) object of the bot's current permissions for a channel.
- `this.options`: When run as a "classic" command, this is an object of special arguments (e.g. `--argument=true`) passed to the command. These arguments are stored in a key/value format, so following the previous example, `this.options.argument` would return true. When run as a slash command, this is an object of every argument passed to the command.

Some options are only available depending on the context/original message type, which can be checked with `this.type`. The options only available with "classic" messages are listed below:

- `this.message`: An Oceanic [`Message`](https://docs.oceanic.ws/latest/classes/Message.Message.html) object of the message that the command was run from, useful for interaction.
- `this.args`: An array of text arguments passed to the command.
- `this.content`: A string of the raw content of the command message, excluding the prefix and command name.
- `this.reference`: An object that's useful if you ever decide to reply to a user inside the command. You can use [`Object.assign`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) to combine your message content with this parameter.

The options only available with application (slash and context menu) commands are listed below:

- `this.interaction`: An Oceanic [`CommandInteraction`](https://docs.oceanic.ws/latest/classes/CommandInteraction.CommandInteraction.html) object of the incoming slash command data.
- `this.optionsArray`: A raw array of command options. Should rarely be used.
- `this.success`: A boolean value that causes the bot to respond with a normal message when set to `true`, or an "ephemeral" message (a message that's only visible to the person who ran the command) when set to `false`.
- `this.edit`: A boolean value that causes the bot to respond by editing the original message when set to `true`, or by creating a followup message when set to `false`.

Some static fields are also available and can be set depending on your command. These fields are listed below:

- `description`: Your command's description, which is shown in the help command.
- `aliases`: An array of command aliases. People will be able to run the command using these as well as the normal command name.
- `arguments`: An array of command argument types, which are shown in the help command.
- `flags`: An array of objects specifying command flags, or special arguments, that will be shown when running `help <command>` or a slash command. Example:
```js
static flags = [{
  name: "argument",
  type: Constants.ApplicationCommandOptionTypes.STRING, // translates to 3, see https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
  description: "Does a thing",
  ...
}];
```
- `slashAllowed`: Specifies whether or not the command is available via slash commands.
- `directAllowed`: Specifies whether or not a command is available in direct messages.
- `adminOnly`: Specifies whether or not a command should be limited to the bot owner(s).

## The `run` Function
The main JS code of your command is specified in the `run` function. This function should return a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) of your command output, which is why the `run` function [is an async function by default](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). The return value inside the `Promise` should be either a string or an object; you should return a string whenever you intend to reply with plain text, or an object if you intend to reply with something else, such as an embed or attachment.