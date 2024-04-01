# Bun Support
With newer versions of esmBot, it is now possible to run it using [Bun](https://bun.sh), a newer JavaScript runtime that aims to be performant while retaining compatibility with Node.js applications and modules. This page exists to document known issues and extra steps that are needed at this time to run the bot on Bun.

!!! warning
    Bun support is still very experimental and prone to bugs. If you find any issues while running the bot on Bun, please test if the same issue occurs on Node; if it doesn't, then specify that it's a Bun-specific issue and provide the version you used (you can find this by running `bun --version`).

## Known Issues
- ~~Discord and image server connections do not handle disconnects properly (see [oven-sh/bun#7896](https://github.com/oven-sh/bun/issues/7896))~~ **Fixed in Bun 1.1!**

## Building the Image Natives
!!! danger
    The following is heavily WIP and does *not* currently work. The instructions below are simply here for developer reference; if you want to use image commands with Bun right now, please run the external image server with the Node natives.

The image natives used with Node are currently incompatible with Bun. Because of this, the bot uses a different set of generic natives that use the `bun:ffi` module instead of Node-API, and as such they must be built differently.

To build the image natives for Bun, run the following commands:
```sh
mkdir -p build
cd build
cmake .. -DWITH_MAGICK=ON
make
```