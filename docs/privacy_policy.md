# martabs Privacy Policy

Effective date: May 26, 2026

martabs is a browser extension that replaces the new tab page with a local bookmark dashboard. This policy explains what data the extension uses and how it is handled.

## Summary

martabs is local-first. It does not use telemetry, analytics, tracking pixels, remote databases, external preview services, external favicon services, or third-party metadata services.

## Data handled by the extension

martabs may access and store the following data locally in your browser:

- Bookmark titles, URLs, folder names and bookmark metadata needed to build the dashboard.
- User settings, selected folders, visual modes, local ordering and local folder aliases.
- Manual tags, pinned bookmarks and custom favicon URLs configured by the user.
- Optional local preview screenshots, only when the user enables local preview capture and opens a bookmark from martabs.
- Optional link check results, only when the user enables link review and manually starts a review.

## Storage

All extension data is stored locally using the browser extension storage APIs. martabs does not send this data to the developer or to any external server.

## Permissions

- `bookmarks`: required to read bookmark folders and to apply bookmark edits requested by the user.
- `storage`: required to save local settings, tags, ordering, pinned bookmarks, cached previews and link review state.
- `favicon`: used only on Chrome to display browser-provided favicons.
- Optional host permissions: requested only when the user enables link review or local preview capture. These permissions are used to check links or capture previews, and martabs attempts to remove them when both optional features are disabled.

## Network activity

martabs does not call external APIs. If link review is enabled and started by the user, martabs may make direct requests to the bookmarked URLs to determine whether they are reachable. If local preview capture is enabled, martabs may capture a page opened from martabs after it loads in the browser.

## Data sharing

martabs does not sell, rent, transfer or share user data.

## Data deletion

You can remove local extension data by uninstalling the extension or clearing extension data from the browser. martabs also includes settings actions to clear cached previews and reset local organization data.

## Contact

For questions or privacy requests, contact martabs.extension@gmail.com.
