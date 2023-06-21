# esmBot and Privacy
First things first: **esmBot does not and is incapable of collecting IP addresses, emails, or any other sensitive personal/private info.** This info is not accessible via Discord's API [except for emails](https://discord.com/developers/docs/resources/user#user-object), which require the email OAuth2 scope to access. esmBot does not use OAuth2 to link to a user account, therefore it does not have access to this info.

Whenever a command is run using esmBot, a command count number is increased. **This counter is completely anonymous and is used only for statistical purposes.** Users can check this info at any time using the count and help commands.

esmBot uses the following user-related info:
+ User IDs (needed for many reasons such as the tag commands and replying to users)
+ Avatars (needed for some embeds and the avatar command)
+ Usernames (for embeds and avatar command)
+ Permissions (for checking if a user has perms to run some commands)
+ Whether the user is a bot (needed to prevent other bots from running commands)

Out of these, **only user IDs are stored in the database**, and they are used only with the tag system for checking the owner of a tag.

esmBot uses the following guild-related info:
+ Guild IDs (for guild-specific settings)
+ Guild channel IDs (for getting where to send a message, storing disabled channels)
+ List of members (for getting permissions and obtaining user objects by ID)

Out of these, **only guild and channel IDs are stored in the database** for configuration info and storing disabled channels/commands, prefixes, and tags.

If you want this data removed on the main instance, you can DM me on Discord (my username is `esm.`) or email me at [data@esmbot.net](mailto:data@esmbot.net).

Hopefully this document is clear enough to help understand what esmBot does and doesn't use. If you have any further questions, please contact me via the [esmBot Support](https://esmbot.net/support) server.
