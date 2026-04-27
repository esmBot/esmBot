# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**esmBot** is a Discord bot built with Oceanic.js providing image editing, music playback, and utility commands. Uses TypeScript (Node.js 22+) with native C++ modules for image processing via libvips/ImageMagick. Fork of [esmBot/esmBot](https://github.com/esmBot/esmBot).

## Commands

```bash
pnpm install                    # Install dependencies (requires pnpm 10.26.2+)
pnpm run build                  # Full build: TypeScript + native C++ modules (with ImageMagick)
pnpm run build:ts               # TypeScript compilation only (outputs to dist/)
pnpm run build:natives           # Compile C++ native modules only (cmake-js)
pnpm run build:no-magick         # Build without ImageMagick support
pnpm start                      # Run bot: node dist/app.js
pnpm start:debug                # Run with DEBUG=true for verbose logging
pnpm start:deno                 # Run with Deno runtime (experimental)
pnpm start-api                  # Run media API server: node dist/api/index.js
pnpm run lint                   # Run oxlint (config: .oxlintrc.json)
pnpm run format                 # Format with oxfmt
pnpm run format:check           # Check formatting without modifying
```

Docker: `pnpm run docker:build` / `pnpm run docker:run-bot`. Full stack (bot + Lavalink) via `compose.yml`.

## Architecture

### Core Flow

1. **Discord events** (`src/events/`) trigger on messages or interactions
2. **Command handler** (`src/utils/handler.ts`) dynamically loads commands from the `commands/` directory
3. **Command execution** — commands extend base classes from `src/classes/`
4. **Response** — results sent to Discord; images >8MB served from a temp web server

### Command System

Commands live in `commands/{category}/{name}.js` as **plain JavaScript** (excluded from TS compilation). They are auto-discovered at startup.

- Extend `Command` (general) or `MediaCommand` (image/video) or `MusicCommand` (audio)
- Classes imported via `#cmd-classes/command.js`, `#cmd-classes/mediaCommand.js`, etc.
- Static properties: `description`, `aliases`, `flags` (parameter definitions)
- MediaCommand adds: `supportedTypes`, `requiresImage`, `params`/`paramsFunc()`
- Directory nesting = subcommands (e.g., `tags/list.js` → `/tags list`)
- `message/` and `user/` categories = right-click context menu commands

### Media Processing Pipeline

1. **Detect** (`src/utils/mediadetect.ts`) — extract image from message, attachment, URL, or cached selection
2. **Validate** — check size, format, spoiler status
3. **Process** — C++ code in `natives/image/` using libvips (+ optional ImageMagick/zxing-cpp)
4. **Return** — send result or serve via temp web server if too large

Processing can run locally (native C++ module) or via external WebSocket API server (`src/api/`).

### Database Layer

`src/database.ts` exports a `DatabasePlugin` interface with two backends:
- `src/database/sqlite.ts` — default, via better-sqlite3
- `src/database/postgresql.ts` — via postgres package

Stores guild settings, command blacklists, prefix overrides, tags, and role permissions. Optional — omitting DB config runs stateless.

### Localization

Community translations via Weblate in `locales/*.json` (27 languages). Auto-loaded at startup. Access via `this.getString("key.path")` or `this.getString("key", { params: { var: value } })`. Missing keys fall back to English (`locales/en-US.json`).

### Clustering

- Discord sharding: automatic via Oceanic (`maxShards: "auto"`)
- Process clustering: optional PM2 (`ecosystem.config.cjs`) or native `node:cluster`
- Hot reload of commands/config via cluster IPC bus
- Music: Lavalink server (separate Java process) via shoukaku library

## Key Technical Details

### TypeScript Configuration

- Target: ES2022, Module: preserve (native ESM, `"type": "module"`)
- `rewriteRelativeImportExtensions: true` — `.ts` imports rewritten to `.js` in output
- Path aliases: `#utils/*`, `#cmd-classes/*`, `#pagination`, `#config/*`
- Source in `src/`, compiled output in `dist/`
- Commands (`commands/`) are plain JS and excluded from compilation

### Configuration Files

- `.env` — required: TOKEN, DB, OWNER, PREFIX, LOCALE (see `.env.example`)
- `config/commands.json` — enable/disable classic vs slash commands
- `config/messages.json` — custom processing emotes and activity status
- `config/servers.json` — Lavalink and media API server endpoints

### Native Modules

C++ source in `natives/` compiled via cmake-js to `.node` files. Requires a C++ toolchain, libvips dev headers, and optionally ImageMagick/zxing-cpp. See docs/setup.md for platform-specific instructions.
