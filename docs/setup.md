# Setup
Here are some instructions to get esmBot up and running from source.

??? check "Recommended system requirements"
    - 64-bit CPU/operating system
    - Quad-core CPU or better
    - 512MB or more of RAM
    - Linux-based operating system or virtual machine ([Ubuntu](https://ubuntu.com/download/server) or [Fedora](https://getfedora.org/) are recommended)

!!! warning
    If you want to run the bot on Windows, [Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/install) is recommended. This guide is somewhat Linux-centric, so for now you're mostly on your own if you decide not to use WSL.

If you have any further questions regarding setup, feel free to ask in the #support channel on the [esmBot Support server](https://esmbot.net/support).

!!! tip
    You can run the bot using Docker for a somewhat simpler setup experience. [Click here to go to the Docker setup guide.](https://docs.esmbot.net/docker)

### 1. Install the required native dependencies.
Choose the distro you're using below for insallation instructions.
=== "Debian/Ubuntu"
    These instructions apply to Debian version 12 (bookworm) or Ubuntu version 22.04 (jammy) or later.
    ```sh
    sudo apt-get install git curl build-essential cmake ffmpeg sqlite3 ttf-mscorefonts-installer libmagick++-dev libvips-dev libcgif-dev libgirepository1.0-dev libimagequant-dev meson
    ```
    On older Debian/Ubuntu versions, you may need to install some of these packages (notably libcgif-dev and meson) through alternative methods.
=== "Fedora/RHEL"
    These instructions apply to Fedora 36/RHEL 9 or later.

    Some of these packages require that you add the RPM Fusion and/or EPEL repositories. You can find instructions on how to add them [here](https://rpmfusion.org/Configuration).
    ```sh
    sudo dnf install git curl cmake ffmpeg sqlite gcc-c++ libcgif-devel ImageMagick-c++-devel vips-devel libimagequant-devel gobject-introspection-devel meson cabextract 
    ```
    On RHEL-based distros like AlmaLinux and Rocky Linux, you may need to add [Remi's RPM Repository](https://rpms.remirepo.net) for the vips package.
    
    Some fonts used in the bot (e.g. Impact) require installing the MS Core Fonts package, which is unavailable through most RHEL repositories. You can install it using the following command (you're on your own regarding dependencies, each RHEL derivative handles them differently):
    ```sh
    sudo rpm -i https://downloads.sourceforge.net/project/mscorefonts2/rpms/msttcore-fonts-installer-2.6-1.noarch.rpm
    ```
=== "Alpine"
    These instructions should apply to the current Edge versions.
    ```sh
    doas apk add git curl msttcorefonts-installer python3 sqlite3 alpine-sdk cmake ffmpeg imagemagick-dev vips-dev gobject-introspection-dev cgif-dev libimagequant-dev meson
    ```
=== "Arch/Manjaro"
    ```sh
    sudo pacman -S git curl cmake pango ffmpeg npm imagemagick libvips sqlite3 libltdl gobject-introspection libcgif libimagequant meson
    ```
    You'll also need to install [`ttf-ms-win10-auto`](https://aur.archlinux.org/packages/ttf-ms-win10-auto/) from the AUR.

***

### 2. Install libvips.

[libvips](https://github.com/libvips/libvips) is the core of esmBot's image processing commands. Version 8.13.0 or higher is required and should be packaged for most distros; however, you may want to build from source to take advantage of the `nsgif` GIF decoder and its improved performance over the default ImageMagick decoder.

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

### 3. Install Node.js.

Node.js is the runtime that esmBot is built on top of. The bot requires version 18 or above to run.

First things first, we'll need to install pnpm, the package manager used by the bot. Run the following to install it:
```sh
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Once you've done that, continue with the instructions for your operating system below.

=== "Debian/Ubuntu"
    You'll need a more recent version than what's provided in most Debian/Ubuntu-based distros. You can add a repository that contains a supported version by running this command:
    ```sh
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
    ```
    After that, you can install Node.js with this command:
    ```sh
    sudo apt-get install nodejs
    ```
=== "Fedora/RHEL"
    On Fedora 37 and above, the package in the default repos should be good enough:
    ```sh
    sudo dnf install nodejs
    ```
    However, on RHEL, you'll need to add a separate repository before you run that command:
    ```sh
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    ```
=== "Alpine"
    ```sh
    doas apk add nodejs
    ```
=== "Arch/Manjaro"
    ```sh
    sudo pacman -S nodejs
    ```

***

### 4. Set up the database.

esmBot officially supports two database systems: SQLite and PostgreSQL. While SQLite is smaller and requires no initial setup, PostgreSQL has better performance (especially in large environments).

!!! tip
    If you're new to databases and self-hosting, choose SQLite.

If you would like to use the SQLite database, no configuration is needed and you can move on to the next step.

If you would like to use the PostgreSQL database, view the setup instructions [here](https://docs.esmbot.net/postgresql) and come back here when you're finished.

***

### 5. Clone the repo and install the required Node modules.
```sh
cd ~
git clone --recursive https://github.com/esmBot/esmBot
cd esmBot
pnpm i -g node-gyp
pnpm install
pnpm build
```

***

### 6. (Optional) Set up Lavalink.

Lavalink is the audio server used by esmBot for music playback. If you do not plan on using this feature, you can safely skip this step.

!!! warning
    There are websites out there providing lists of public Lavalink instances that can be used with the bot. However, these are not recommended due to performance/security concerns and missing features, and it is highly recommended to set one up yourself instead using the steps below.

esmBot requires Lavalink version v4 or later, which requires a Java (17 or later) installation. You can use [SDKMAN](https://sdkman.io) to install Eclipse Temurin, a popular Java distribution:
```sh
sdk install java 17.0.9-tem
```

Initial setup is like this:
```sh
cd ~
mkdir Lavalink
cd Lavalink
curl -OL https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar
cp ~/esmBot/application.yml .
ln -s ~/esmBot/assets assets
```
To run Lavalink, you can use this command:
```sh
java -jar Lavalink.jar
```

!!! info
    You'll need to run Lavalink alongside the bot in order to use it. There are a few methods to do this, such as the `screen` command, creating a new systemd service, or simply just opening a new terminal session alongside your current one.

***

### 7. Configure the bot.

Configuration is done via environment variables which can be specified through a `.env` file. Copy `.env.example` to get a starter config file:
```sh
cp .env.example .env
```

!!! tip
    If you can't see either of these files, don't worry - Linux treats files whose names start with a . as hidden files.

To edit this file in the terminal, run this command:
```sh
nano .env
```
This will launch a text editor with the file ready to go. Create a Discord application [here](https://discord.com/developers/applications) and select the Bot tab on the left, then create a bot user. Once you've done this, copy the token it gives you and put it in the `TOKEN` variable.

When you're finished editing the file, press Ctrl + X, then Y and Enter.

An overview of each of the variables in the `.env` file can be found [here](https://docs.esmbot.net/config).

***

### 8. Run the bot.

Once everything else is set up, you can start the bot like so:
```sh
pnpm start
```
If the bot starts successfully, you're done! You can invite the bot to your server by generating an invite link under OAuth -> URL Generator in the Discord application dashboard.

!!! note
    You will need to select the `bot` and `applications.commands` scopes.
    The following permissions are needed in most cases for the bot to work properly:

    <figure markdown>
    ![Required permissions](assets/permissions.png){ loading=lazy, width=500 }
    <figcaption>click to enlarge</figcaption>
    </figure>

If you want the bot to run 24/7, you can use the [PM2](https://pm2.keymetrics.io) process manager. Install it using the following command:
```sh
pnpm add -g pm2
```

Once you've done that, you can start the bot using the following command:
```sh
pm2 start ecosystem.config.cjs
```

!!! tip
    If you wish to update the bot to the latest version/commit at any time, just run `git pull` and `pnpm install`.

***

## Troubleshooting
??? faq "Error: Cannot find module './build/Release/image.node'"
    The native image functions haven't been built. Run `pnpm run build` to build them.

??? faq "`pnpm install` or `pnpm build` fails with error 'ELIFECYCLE  Command failed.'"
    You seem to be missing node-gyp. This can be fixed by running:
    ```sh
    pnpm i -g node-gyp
    rm -rf node_modules
    pnpm install
    ```

??? faq "Error: connect ECONNREFUSED 127.0.0.1:5432"
    PostgreSQL isn't running, you should be able to start it with `sudo systemctl start postgresql`. If you don't intend to use PostgreSQL, you should take another look at your `DB` variable in the .env file.

??? faq "Gifs from Tenor result in a "no decode delegate for this image format" or "improper image header" error"
    Tenor GIFs are actually stored as MP4s, which libvips can't decode most of the time. You'll need to get a Tenor API key from [here](https://developers.google.com/tenor/guides/quickstart) and put it in the `TENOR` variable in .env.

***

If you have any further questions regarding self-hosting, feel free to ask in the #support channel on the [esmBot Support server](https://esmbot.net/support).
