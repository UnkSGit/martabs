# Bookmark Home Extension

Lightweight New Tab bookmark dashboard for Chrome, with a Firefox-ready WebExtension architecture.

## Development

Run tests:

```powershell
npm test
```

Build both browser variants:

```powershell
npm run build
```

Build only Chrome:

```powershell
npm run build:chrome
```

Build only Firefox:

```powershell
npm run build:firefox
```

## Load in Chrome

1. Run `npm run build:chrome`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Load unpacked extension from `dist/chrome`.

## Load in Firefox

1. Run `npm run build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Load temporary add-on from `dist/firefox/manifest.json`.
