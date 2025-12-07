# Runtime Compatibility

esmBot is developed using Node.js modules and APIs, and officially supports both the Node.js and Deno runtimes. This page exists to document specific details and runtime-specific differences when running esmBot.

!!! warning

    esmBot primarily targets Node.js, and as such running on Deno could introduce extra bugs. If you find any issues while running the bot on Deno, please test if the same issue occurs on Node; if it doesn't, then specify that it's an issue specific to Deno and provide the version you experienced the bug on (you can find this by running `deno --version`).

## Setup

esmBot requires Node.js 22.0.0 or Deno 2.3 minimum to run.

To set up the bot for usage with Deno, follow the [setup guide](https://docs.esmbot.net/setup) as usual. However, depending on which runtime you choose, the launch command will be different:

- Node.js: `pnpm start`
- Deno: `pnpm start:deno`

Additionally, you can replace `pnpm build` with `pnpm build:natives` when running with Deno, since they are capable of executing TypeScript directly without transpiling to JavaScript first.

## Differences

esmBot uses some Deno-specific utilities when detected to add extra capabilities or improve performance in certain cases.

Here's the current list of behavior changes exclusive to Deno:

- The stats command shows Deno's version number instead of Node's
- The SQLite database driver uses `@db/sqlite` from [JSR](https://jsr.io/@db/sqlite) instead of `better-sqlite3`
- Database plugins are loaded with the `.ts` extension instead of `.js`

## Known Issues

- You may experience crashes on startup involving native modules (e.g. better-sqlite3, the media natives) when running with Deno. If this happens on your end, try switching your Node.js version to 22 and running `pnpm rebuild`.
