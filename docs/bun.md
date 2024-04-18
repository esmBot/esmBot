# Bun Support
With newer versions of esmBot, it is now possible to run it using [Bun](https://bun.sh), a newer JavaScript runtime that aims to be performant while retaining compatibility with Node.js applications and modules. This page exists to document known issues and extra steps that are needed at this time to run the bot on Bun.

!!! warning
    Bun support is still very experimental and prone to bugs. If you find any issues while running the bot on Bun, please test if the same issue occurs on Node; if it doesn't, then specify that it's a Bun-specific issue and provide the version you used (you can find this by running `bun --version`).

## Known Issues
- <s>Discord and image server connections do not handle disconnects properly (see [oven-sh/bun#7896](https://github.com/oven-sh/bun/issues/7896))</s> **Fixed in Bun 1.1!**

## Image Natives
Previously, the image natives used with Node did not work when using Bun; however, with the current Bun version as of this writing (1.1.4), they appear to work with no issue. It should be possible to build and use them with Bun as if you were working with Node.