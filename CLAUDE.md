# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working rules (from the repo owner)

These apply to every request in this repo:

1. Before starting, check the available skills, tools, MCP servers, agents and commands. Use any that are relevant without waiting to be told which one, and combine them when useful. Prefer a specialized skill over doing the work by hand, but skip skills that don't fit the task.
2. Inspect the project files before making assumptions.
3. For code changes: read the existing code first, follow the existing structure, implement the change (don't just explain it), then run checks.
4. For large tasks, make a short plan, then execute it.
5. Default to action rather than only suggesting what the owner should do.

Skills that have been useful here: `anthropic-skills:taste-skill` (design rules for the page) and `anthropic-skills:impeccable` (critique, polish, audit and its `detect` checker).

## What this is

A one-page personal portfolio for Mu3z: Skript and Java developer for Minecraft PvP servers (EffectsFFA, Rascal PvP), plus Fortnite macros. Plain HTML, CSS and JavaScript with no build step, no package.json and no tests. Intended for GitHub Pages (branch root).

## Commands

```sh
python3 -m http.server 8000   # serve locally, then open http://localhost:8000
node --check script.js        # syntax check the only script
```

Visual checks are done with Playwright against the local server. In the cloud container, launch Chromium with `executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'` and never run `playwright install`. Check desktop (1440px) and phone (390px) widths in both light and dark mode, and confirm there is no horizontal overflow and no console errors.

## Architecture

- `index.html` links `styles.css?v=N` and `script.js?v=N`; bump N on every change to either file so visitors don't get stale cached copies from GitHub Pages.
- `index.html` holds all content. An inline script in `<head>` applies the saved `theme` and `accent` from localStorage before first paint; keep the allowed accent names there in sync with the `[data-accent]` blocks in `styles.css` and the swatch buttons in the nav.
- `styles.css` is token driven. Accent palettes are named after Minecraft materials (diamond is the default, then emerald, amethyst, lapis, redstone, gold, copper) and are pairs per `[data-accent]`: `--acc-d` for dark backgrounds, `--acc-l` for light ones, `--ink-d` for button text on the dark accent. The dark theme is the `:root` default; the light theme is defined twice (under `[data-theme="light"]` and under `prefers-color-scheme: light` for `:root:not([data-theme="dark"])`), so edit both copies together. Each accent pair was chosen to pass WCAG AA in both themes; recheck contrast when adding one.
- `script.js` is one IIFE that wires up the theme toggle (circle reveal via View Transitions), phone menu and accent picker (shared outside-click/Escape handling), the typed hero headline (wraps each character in a `.type-char` span with a `--c` index), Skript/Java code tabs (ARIA tablist; lines replay on switch), scroll reveals, the macro keycaps (auto demo plus live keyboard, pointer/touch/pen, mouse side buttons and Gamepad API input) and the Discord copy button. The inline `<head>` script adds the `js` class to `<html>` before paint; CSS only hides animated elements under `.js` and `prefers-reduced-motion: no-preference`, and `.js-only` controls are hidden without JS, so the page still works without JS or with reduced motion.
- The Discord username (`_mu3z`) lives in two places: `data-discord` on `<body>` (what gets copied) and the `[data-handle]` span (what is shown).
- The contact section's profile card goes live when `data-discord-id` on `<body>` holds the owner's Discord user ID: `script.js` polls Lanyard (`https://api.lanyard.rest/v1/users/<id>`, every 30s while the tab is visible) for avatar, status, custom status and activity. The owner must be in the Lanyard Discord server for it to return data. With the ID empty, the card stays static. The banner `assets/discord-banner.webp` is a still frame of the owner's banner GIF (klipy.com/gifs/rust-ron), with a slow CSS drift. Klipy sits behind Cloudflare bot protection: its embed player is refused inside other sites and automated downloads only get the challenge page, so don't embed or scrape it. If the owner provides the animated file itself, self-host it with a still fallback for `prefers-reduced-motion`.
- Fonts and icons are self-hosted in `assets/`: Monocraft (Minecraft-style; headings, UI labels, code, keys) and Pixelify Sans (body text), plus the Phosphor icon font. Monocraft is subset to Latin with `pyftsubset` from the upstream TTFs (github.com/IdreesInc/Monocraft). The owner wants the site to look like Minecraft; don't swap these for generic fonts. Don't add CDN or Google Fonts links. Check that a Phosphor icon exists with `grep "ph-<name>:before" assets/icons/style.css` before using it.

Hosting: GitHub Pages (`.github/workflows/pages.yml`, on push) and Cloudflare Workers (`wrangler.jsonc`, deployed by Cloudflare's Git integration running `npx wrangler deploy`). Both publish only `index.html`, `styles.css`, `script.js` and `assets/`; Wrangler copies them into `dist/` first (gitignored). When adding a new top-level site file, add it to both the Pages workflow and the `build.command` in `wrangler.jsonc`. Dry-run the Cloudflare deploy with `npx wrangler@4 deploy --dry-run`.

To check the deployed site in a real browser with full internet access, run the `Check live site` workflow (`.github/workflows/check-site.yml`, script in `.github/check/banner.mjs`) with `workflow_dispatch` and read the job log.

## Design rules in force

- No em dashes or en dashes anywhere in visible text.
- Minecraft look: square corners everywhere (`--radius: 0`), raised controls use the dark-outline plus light/dark bevel pattern, headings use the Minecraft drop shadow (`text-shadow` with `--text-shadow` / `--accent-shadow`). One accent color at a time. No eyebrow labels above headings.
- Motion: typed headline, hero and code-line reveal, server tiles arriving as a list, theme circle reveal, accent recolor fade, button/keycap press feedback. Every animation has a `prefers-reduced-motion` path. Hover effects sit behind `(hover: hover) and (pointer: fine)`; touch targets are at least 44px under `(pointer: coarse)`.
- Confirmed by the owner: the owner never worked at NullifyFFA, so don't mention it anywhere. Java and Skript on EffectsFFA, Skript on Rascal PvP (a former role, "used to be Dev"), manager and developer at EffectsFFA, Discord `_mu3z`. The contact section's Discord-style profile card quotes the owner's real Discord bio verbatim; keep its wording as is. The rest of the server descriptions, the tools list and the example code are placeholder copy the owner may replace.
