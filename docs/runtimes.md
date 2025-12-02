# Runtime Compatibility

esmBot is primarily developed to run on the [Node.js](https://nodejs.org) runtime, using Node.js modules and APIs. However, since esmBot was originally released, two other major runtimes have appeared: [Deno](https://deno.com) and [Bun](https://bun.sh). Despite primarily targeting Node.js, esmBot is capable of running on both of these runtimes as well; this page exists to document specific details regarding running it on Deno and Bun.

!!! warning

    esmBot on other runtimes can be prone to bugs. If you find any issues while running the bot on Bun or Deno, please test if the same issue occurs on Node; if it doesn't, then specify that it's an issue specific to the runtime being used and provide the version you experienced the bug on (you can find this by running `bun --version` on Bun or `deno --version` on Deno).

## Setup

esmBot requires Node.js 22.0.0, Bun 1.1, or Deno 2.3 minimum to run.

To set up the bot for usage with Deno or Bun, follow the [setup guide](https://docs.esmbot.net/setup) as usual. However, depending on which runtime you choose, the launch command will be different:

- Node.js: `pnpm start`
- Bun: `pnpm start:bun`
- Deno: `pnpm start:deno`

Additionally, you can replace `pnpm build` with `pnpm build:natives` when running with Bun or Deno, since they are capable of executing TypeScript directly without transpiling to JavaScript first.

## Differences

esmBot uses some features present in Deno and Bun (but missing in Node.js) when detected to add extra capabilities or improve performance in certain cases.

Here's the current list of behavior changes when Deno or Bun are detected:

- The stats command shows the version number of the currently used runtime instead of Node's

Here's the current list of behavior changes exclusive to Bun:

- The SQLite database driver uses `bun:sqlite` instead of `better-sqlite3`

Here's the current list of behavior changes exclusive to Deno:

- The SQLite database driver uses `@db/sqlite` from [JSR](https://jsr.io/@db/sqlite) instead of `better-sqlite3`
- Database plugins are loaded with the `.ts` extension instead of `.js`

## Known Issues

- You may experience crashes on startup involving native modules (e.g. better-sqlite3, the media natives) when running with Deno or Bun. For Deno, try switching your Node.js version to 22 and running `pnpm rebuild`. For Bun, you should switch to Node.js 24 and then run the same command.
