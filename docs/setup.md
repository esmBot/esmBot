# Setup
Here are some instructions to get esmBot up and running from source.

Recommended system requirements:
- 64-bit CPU/operating system
- Quad-core CPU or better
- 1GB or more of RAM
- Linux-based operating system or virtual machine (Ubuntu 22.04 LTS is recommended)

If you want to run the bot on Windows, [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10) is recommended. This guide is somewhat Linux-centric, so for now you're mostly on your own if you decide not to use WSL.

If you have any further questions regarding setup, feel free to ask in the #self-hosting-support channel on the [esmBot Support server](https://projectlounge.pw/support).

## Setup
#### 1. Install the required native dependencies.
**Debian (bookworm)/Ubuntu (22.04 or later)**  
```sh
sudo apt-get install git curl build-essential cmake ffmpeg sqlite3 ttf-mscorefonts-installer libmagick++-dev libvips-dev libcgif-dev libgirepository1.0-dev fonts-noto-color-emoji libimagequant-dev meson
```
On older Debian/Ubuntu versions, you may need to install some of these packages (notably libcgif-dev and meson) through alternative methods.

**Fedora/RHEL**
Some of these packages require that you add the RPM Fusion repository. You can find instructions on how to add it here: https://rpmfusion.org/Configuration 
RHEL users may also need to add the EPEL repository. Instructions for adding it can be found here: https://docs.fedoraproject.org/en-US/epel/
```sh
sudo dnf install git curl cmake ffmpeg sqlite gcc-c++ libcgif-devel ImageMagick-c++-devel vips-devel libimagequant-devel gobject-introspection-devel twitter-twemoji-fonts meson
```
On RHEL-based distros like AlmaLinux and Rocky Linux, you may need to add [Remi's RPM Repository](https://rpms.remirepo.net) for the vips package.

**Alpine (edge)**
```sh
doas apk add git curl msttcorefonts-installer python3 sqlite3 alpine-sdk cmake ffmpeg imagemagick-dev vips-dev font-noto-emoji gobject-introspection-dev cgif-dev libimagequant-dev meson
```

**Arch/Manjaro**
```sh
sudo pacman -S git curl cmake pango ffmpeg npm imagemagick libvips sqlite3 libltdl noto-fonts-emoji gobject-introspection libcgif libimagequant meson
```
Arch/Manjaro users: you'll also need to install [`ttf-ms-fonts`](https://aur.archlinux.org/packages/ttf-ms-fonts/) from the AUR.

***

#### 2. Install libvips.

[libvips](https://github.com/libvips/libvips) is the core of esmBot's image processing commands. The latest version as of writing this (8.12.2) is recommended because it contains fixes to GIF handling; however, there's also a missing feature in this version that is needed for the freeze command to work (see [libvips pull request #2709](https://github.com/libvips/libvips/pull/2709)). To fix this, you'll need to build libvips from source.

**Alpine and Arch users can skip this step, since both distros now have 8.13.0 packaged.**

First, download the source and move into it:
```sh
git clone https://github.com/libvips/libvips
cd libvips
```
From here, you can set up the build:
```sh
meson setup --prefix=/usr --buildtype=release -Dnsgif=true build
```
If that command finishes with no errors, you can compile and install it:
```sh
cd build
meson compile
sudo meson install
```

***

#### 3. Install Node.js.

Node.js is the runtime that esmBot is built on top of. The bot requires version 15 or above to run.

First things first, we'll need to install pnpm, the package manager used by the bot. Run the following to install it:
```sh
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Once you've done that, continue with the instructions for your operating system below.

**Debian/Ubuntu**  
You'll need a more recent version than what's provided in most Debian/Ubuntu-based distros. You can add a repository that contains a supported version by running this command:
```sh
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo bash -
```
After that, you can install Node.js with this command:
```sh
sudo apt-get install nodejs
```

**Fedora/RHEL**
```sh
sudo dnf install nodejs
```

**Alpine**
```sh
doas apk add nodejs
```

**Arch/Manjaro**
```sh
sudo pacman -S nodejs
```

***

#### 4. Set up the database.

esmBot officially supports two database systems: SQLite and PostgreSQL. While SQLite is smaller and requires no initial setup, PostgreSQL has better performance (especially in large environments).

If you would like to use the SQLite database, no configuration is needed and you can move on to the next step.

If you would like to use the PostgreSQL database, view the setup instructions [here](https://github.com/esmBot/esmBot/wiki/PostgreSQL) and come back here when you're finished.

***

#### 5. Clone the repo and install the required Node modules.
```sh
cd ~
git clone --recurse-submodules https://github.com/esmBot/esmBot
cd esmBot
pnpm i -g node-gyp
pnpm install
pnpm build
```
You'll also need to copy over some fonts for the image commands:
```sh
sudo cp assets/*.ttf assets/*.otf /usr/local/share/fonts
fc-cache -fv
```

***

#### 6. (Optional) Set up Lavalink.

Lavalink is the audio server used by esmBot for soundboard commands and music playback. If you do not plan on using these features, you can safely skip this step.

Lavalink requires a Java (11 or 13) installation. You can use [SDKMAN](https://sdkman.io) to install Eclipse Temurin, a popular Java distribution:
```sh
sdk install java 11.0.15-tem
```

Initial setup is like this:
```sh
cd ~
mkdir Lavalink
cd Lavalink
wget https://github.com/Cog-Creators/Lavalink-Jars/releases/latest/download/Lavalink.jar
cp ~/esmBot/application.yml .
ln -s ~/esmBot/assets assets
```
To run Lavalink, you can use this command:
```sh
java -Djdk.tls.client.protocols=TLSv1.2 -jar Lavalink.jar
```

***

#### 7. Configure the bot.

Configuration is done via environment variables which can be specified through a `.env` file. Copy `.env.example` to get a starter config file:
```sh
cp .env.example .env
```
If you can't see either of these files, don't worry - Linux treats files whose names start with a . as hidden files. To edit this file in the terminal, run this command:
```sh
nano .env
```
This will launch a text editor with the file ready to go. Create a Discord application at https://discord.com/developers/applications and select the Bot tab on the left, then create a bot user. Once you've done this, copy the token it gives you and put it in the `TOKEN` variable.

When you're finished editing the file, press Ctrl + X, then Y and Enter.

An overview of each of the variables in the `.env` file can be found [here](https://github.com/esmBot/esmBot/wiki/Config).

***

#### 8. Run the bot.

Once everything else is set up, you can start the bot like so:
```sh
pnpm start
```
If the bot starts successfully, you're done! You can invite the bot to your server by generating an invite link [here](https://discordapi.com/permissions.html#3533888).

If you want the bot to run 24/7, you can use the [PM2](https://pm2.keymetrics.io) process manager. Install it using the following command:
```sh
pnpm add -g pm2
```

Once you've done that, you can start the bot using the following command:
```sh
pm2 start app.js
```

***

If you wish to update the bot to the latest version/commit at any time, just run `git pull` and `pnpm install`.

***

## Troubleshooting
### Error: Cannot find module './build/Release/image.node'
The native image functions haven't been built. Run `pnpm run build` to build them.

### pnpm fails with error 'ELIFECYCLE  Command failed.'
You seem to be missing node-gyp, this can be fixed by running:
```sh
pnpm -g install node-gyp
rm -r node_modules
pnpm install
```

### Error: connect ECONNREFUSED 127.0.0.1:5432
PostgreSQL isn't running, you should be able to start it with `sudo systemctl start postgresql`. If you don't intend to use PostgreSQL, you should take another look at your `DB` variable in the .env file.

### Gifs from Tenor result in a "no decode delegate for this image format" or "improper image header" error
Tenor GIFs are actually stored as MP4s, which libvips can't decode most of the time. You'll need to get a Tenor API key from [here](https://developers.google.com/tenor/guides/quickstart) and put it in the `TENOR` variable in .env.

### Emojis are missing in some commands
Your system doesn't have an emoji font installed. You can install Google's emoji set with `sudo apt-get install fonts-noto-color-emoji` on Debian/Ubuntu systems, `doas apk add font-noto-emoji` on Alpine, and `sudo pacman -S noto-fonts-emoji` on Arch/Manjaro.

If you want to use the same set that Discord and the main bot uses (Twemoji) then it's slightly more difficult. Go to https://koji.fedoraproject.org/koji/packageinfo?packageID=26306 and choose the latest build, then download the `noarch` RPM file. You'll then have to extract this file; most graphical tools (e.g. 7-Zip, Ark, The Unarchiver) should be able to extract this just fine, but on the command line you'll have to use the `rpm2cpio` tool. The font file should be inside the archive at `usr/share/fonts/Twemoji/Twemoji.ttf`; copy this to `/usr/share/fonts/Twemoji.ttf` (note the / at the beginning). After this, run `fc-cache -fv` and you should be good to go!

### Sound/music commands do nothing
Make sure Lavalink is running and started up completely. The bot skips loading sound commands if Lavalink is not present, so make sure it's running when the bot starts as well.

***

If you have any further questions regarding self-hosting, feel free to ask in the #self-hosting-support channel on the [esmBot Support server](https://projectlounge.pw/support).
