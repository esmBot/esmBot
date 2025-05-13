# Bun Support

[Bun](https://bun.sh) is a JavaScript and TypeScript runtime that aims to be performant while retaining compatibility with Node.js applications and modules. This page exists to document details about esmBot when running on Bun.

!!! warning

    Bun support is still very experimental and prone to bugs. If you find any issues while running the bot on Bun, please test if the same issue occurs on Node; if it doesn't, then specify that it's a Bun-specific issue and provide the version you used (you can find this by running `bun --version`).

## Setup

To set up the bot for usage with Bun, follow the [setup guide](https://docs.esmbot.net/setup) as usual, but use the `pnpm start:bun` command to start the bot instead. Additionally, you can replace `pnpm build` with `pnpm build:natives`; since Bun is capable of executing TypeScript directly, transpiling it to JavaScript is not needed.

## Differences

esmBot uses some of Bun's exclusive features when detected to add extra capabilities or improve performance in certain cases. Here's the current list of Bun-specific behavior:

- The stats command shows Bun's version number instead of Node's
- The SQLite database driver uses `bun:sqlite` instead of `better-sqlite3`
- Commands and event handlers written in TypeScript (using the .ts extension) can be loaded natively

## Known Issues

- <s>Discord and image server connections do not handle disconnects properly (see [oven-sh/bun#7896](https://github.com/oven-sh/bun/issues/7896))</s> **Fixed in Bun 1.1!**

## Image Natives

Previously, the image natives used with Node did not work when using Bun; however, as of Bun 1.1.4, they appear to work with no issue. It should be possible to build and use them with Bun as if you were working with Node.
