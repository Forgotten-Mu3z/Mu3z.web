# Mu3z.web

Personal site for Mu3z: Skript and Java developer for Minecraft PvP servers (EffectsFFA, Rascal PvP) and Fortnite macros.

Plain HTML, CSS and JavaScript. No build step.

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Edit

- Text and sections: `index.html`
- Discord username: the `data-discord` attribute on `<body>` and the `data-handle` span in `index.html`
- Colors, fonts and layout: `styles.css` (theme tokens are at the top)

## Publish on GitHub Pages

Repo Settings > Pages > Source: "Deploy from a branch", pick the branch and `/ (root)`.

Fonts: Monocraft and Pixelify Sans (SIL Open Font License). Icons: Phosphor Icons (MIT).

## Publish on Cloudflare

Connect the repo in Cloudflare (Workers & Pages > Create > Import a repository). Leave the build command empty and keep the deploy command `npx wrangler deploy`; `wrangler.jsonc` copies the site files into `dist/` and serves them as static assets.
