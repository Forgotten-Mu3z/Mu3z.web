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

A one-page personal portfolio for Mu3z: Skript and Java developer for Minecraft PvP servers (NullifyFFA, EffectsFFA, Rascal PvP), plus Fortnite macros. Plain HTML, CSS and JavaScript with no build step, no package.json and no tests. Intended for GitHub Pages (branch root).

## Commands

```sh
python3 -m http.server 8000   # serve locally, then open http://localhost:8000
node --check script.js        # syntax check the only script
```

Visual checks are done with Playwright against the local server. In the cloud container, launch Chromium with `executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'` and never run `playwright install`. Check desktop (1440px) and phone (390px) widths in both light and dark mode, and confirm there is no horizontal overflow and no console errors.

## Architecture

- `index.html` holds all content. An inline script in `<head>` applies the saved `theme` and `accent` from localStorage before first paint; keep the allowed accent names there in sync with the `[data-accent]` blocks in `styles.css` and the swatch buttons in the nav.
- `styles.css` is token driven. Accent palettes are pairs per `[data-accent]`: `--acc-d` for dark backgrounds, `--acc-l` for light ones, `--ink-d` for button text on the dark accent. The dark theme is the `:root` default; the light theme is defined twice (under `[data-theme="light"]` and under `prefers-color-scheme: light` for `:root:not([data-theme="dark"])`), so edit both copies together. Each accent pair was chosen to pass WCAG AA in both themes; recheck contrast when adding one.
- `script.js` is one IIFE that wires up the theme toggle, accent picker, Skript/Java code tabs (ARIA tablist with arrow keys), the hero entrance reveal, the macro keycap sequence and the Discord copy button. It adds a `js` class to `<html>`; the CSS only hides `.reveal` elements under `.js` and `prefers-reduced-motion: no-preference`, so the page still renders without JS or with reduced motion.
- The Discord username lives in two places: `data-discord` on `<body>` (what gets copied) and the `[data-handle]` span (what is shown).
- Fonts and icons are self-hosted in `assets/` (Bricolage Grotesque, JetBrains Mono, Geist Pixel for the "Mu3z" wordmark and tile letters; Phosphor icon font). Don't add CDN or Google Fonts links. Check that a Phosphor icon exists with `grep "ph-<name>:before" assets/icons/style.css` before using it.

## Design rules in force

- No em dashes or en dashes anywhere in visible text.
- One accent color at a time. Cards, buttons and inputs use `--radius` (12px); only the small language tags (6px) and the round color swatches differ. No eyebrow labels above headings.
- Motion stays limited to the hero entrance, the code-line reveal and the keycap sequence, and all of it respects `prefers-reduced-motion`.
- Server descriptions, the tools list, the Java/Skript example code and the Discord handle `mu3z` are placeholder copy the owner may replace; don't present them as confirmed facts.
