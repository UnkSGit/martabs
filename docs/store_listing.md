# martabs Store Listing Draft

This document contains draft copy for Chrome Web Store and Firefox Add-ons.

## Basic information

- Name: martabs
- Category: Productivity
- Pricing: Free
- Support email: martabs.extension@gmail.com
- Source code: https://github.com/UnkSGit/martabs
- Privacy policy: https://unksgit.github.io/martabs/privacy_policy.html

## Short description

A private new tab dashboard for organizing, searching and reviewing your browser bookmarks locally.

## Long description

martabs replaces your browser's new tab page with a fast, local-first bookmark dashboard.

It is designed for people who have many bookmarks spread across folders and want a cleaner way to find, scan and organize them without sending bookmark data to an external service.

Features:

- Search bookmarks locally by title, URL, domain, folder and tags.
- Choose which bookmark folders appear on the dashboard.
- Use multiple visual modes per folder, including list, compact, icons, large icons and quicklinks.
- Pin important bookmarks and optionally show them in a virtual pinned folder.
- Add manual tags and use automatic tags derived from folders and domains.
- Reorder bookmarks locally without changing the browser's real bookmark order.
- Move bookmarks locally between monitored folders without changing the browser's real folder structure.
- Edit bookmark title, URL, tags and custom icon directly from the dashboard.
- Optionally capture local previews for bookmarks opened from martabs.
- Optionally review links manually to find unreachable bookmarks.
- Import and export configuration between profiles.
- Use light, dark or system theme.
- Choose the interface language from the settings panel.

Privacy:

martabs stores data locally in your browser. It does not use telemetry, analytics, external preview services, external favicon services, remote metadata services or sync servers.

## Permission explanations

### bookmarks

Required to read the user's bookmark tree, build the dashboard from selected folders and apply bookmark edits requested by the user.

### storage

Required to store local settings, selected folders, visual modes, local ordering, manual tags, pinned bookmarks, cached previews and link review state.

### favicon

Chrome-only permission used to display browser-provided favicons. Firefox does not use this permission.

### Optional host permissions

Requested only when the user enables optional link review or optional local preview capture.

For link review, martabs checks bookmarked URLs only when the user starts a review manually.

For preview capture, martabs captures a local preview only when the user opens a bookmark from martabs and preview capture is enabled.

When both optional features are disabled, martabs attempts to remove the optional host permissions.

## Suggested screenshots

- `docs/assets/screenshots/dashboard-dark.png`
- `docs/assets/screenshots/dashboard-light.png`
- `docs/assets/screenshots/search-results.png`
- `docs/assets/screenshots/settings.png`
- `docs/assets/screenshots/folder-modes.png`
- `docs/assets/screenshots/edit-bookmark.png`

## Reviewer notes

See `docs/reviewer_notes.md`.
