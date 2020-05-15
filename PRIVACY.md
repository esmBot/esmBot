# esmBot and Privacy
First things first: esmBot does not collect IP addresses, emails, or any other personal/private info. This info is not accessible via Discord's API [except for emails](https://discordapp.com/developers/docs/resources/user#user-object), which require the email OAuth2 scope to access. esmBot does not use OAuth2 to link to a user account, therefore it does not have access to this info.

esmBot uses the following user-related info:
+ User IDs (needed for many reasons such as the tag commands and replying to users)
+ Avatars (needed for some embeds and the avatar command)
+ Usernames (for embeds and avatar command)
+ Discriminators (embeds)
+ Permissions (for checking if a user has perms to run some commands)
+ Whether the user is a bot (needed to prevent other bots from running commands)

Out of these, **only user IDs are stored in the database**, and they are used for checking the owner of a tag as well as storing a user's warnings.

![Tags section in the database](https://projectlounge.pw/pictures/tags.png)

esmBot uses the following guild-related info:
+ Guild IDs (for guild-specific settings)
+ List of members (for getting permissions and obtaining user objects by ID)
+ Guild names (for embeds)
+ Icons (embeds)

Out of these, **only guild IDs are stored in the database** for configuration info and storing warns, disabled channels, prefixes, and tags.

The stored info is stored in the database forever; however, I do intend to change this in the future. If you want this data removed, you can DM me on Discord (Essem#9261) or email me at [data@essem.space](mailto:data@essem.space).

Hopefully this document is clear enough to help understand what esmBot does and doesn't use. If you have any further questions, please contact me via the [esmBot Support](https://projectlounge.pw/support) server.
