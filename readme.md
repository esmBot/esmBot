# <img src="https://github.com/esmBot/esmBot/raw/master/esmbot.png" width="128"> esmBot
[![esmBot Support](https://discordapp.com/api/guilds/592399417676529688/embed.png)](https://discord.gg/vfFM7YT) ![GitHub license](https://img.shields.io/github/license/esmBot/esmBot.svg)


esmBot is an easily-extendable, multipurpose, and entertainment-focused Discord bot made using [Eris](https://abal.moe/Eris/) with image, music, and utility commands, alongside many others.

[![Top.gg](https://top.gg/api/widget/429305856241172480.svg)](https://top.gg/bot/429305856241172480)

## Usage
You can invite the bot to your server using this link: https://projectlounge.pw/invite

A command list can be found [here](https://projectlounge.pw/esmBot/help.html).

The bot is only supported on Linux/Unix-like operating systems. If you want to run it locally for testing purposes, you should install ImageMagick (version >=7), FFmpeg, MongoDB, libstb and the Microsoft core fonts:

```shell
# On most Debian/Ubuntu-based distros you will need to build ImageMagick from source instead of installing from apt/similar package managers.
# Instructions to do so can be found here: https://imagemagick.org/script/install-source.php
sudo apt-get install imagemagick ffmpeg mongodb ttf-mscorefonts-installer libstb-dev
```
You'll also need to build and install [zxing-cpp](https://github.com/nu-book/zxing-cpp) from source.

After that, you should install the rest of the dependencies using npm:

```shell
npm install
```

And set up Lavalink: https://github.com/Frederikam/Lavalink#server-configuration

Finally, fill in the info inside `.env.example`, rename it to `.env`, and run `app.js`.

If you need any help with setting up the bot locally, feel free to ask in the #self-hosting channel on the [esmBot Support server](https://discord.gg/vfFM7YT).

## Credits
Icon by [Stellio](https://twitter.com/SteelStellio).
All images, sounds, and fonts are copyright of their respective owners.
