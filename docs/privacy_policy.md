# martabs Privacy Policy

**Effective date:** September 6, 2026

martabs is a browser extension that replaces the new tab page with a local bookmark dashboard. This policy explains what data the extension uses and how it is handled.

## Summary

martabs is local-first. It does not use telemetry, analytics, tracking pixels, remote databases, or external preview services. Optional Weather and Sports widgets contact their public data providers only when you enable them.

## Data handled by the extension

martabs may access and store the following data locally in your browser:

- Bookmark titles, URLs, folder names and bookmark metadata needed to build the dashboard.

- User settings, selected folders, visual modes, local ordering and local folder aliases.

- Manual tags, pinned bookmarks and custom favicon URLs configured by the user.

- Optional local preview screenshots, only when the user enables local preview capture and opens a bookmark from martabs.

- Optional link check results, only when the user enables link review and manually starts a review.

- Optional top sites (most frequently visited pages), only when the user enables the optional "Frequent Sites" folder.

## Storage

Extension data is stored locally using the browser extension storage APIs and IndexedDB, including uploaded wallpaper blobs. martabs does not send bookmark content, tags or bookmark organization data to the developer. Optional widgets and other user-started network features can send the specific data described below to their destination services.

## Permissions

- **bookmarks:** required to read bookmark folders and to apply bookmark edits requested by the user.

- **storage:** required to save local settings, tags, ordering, pinned bookmarks, cached previews and link review state.

- **favicon:** used only on Chrome to display browser-provided favicons.

- **Optional topSites permission:** requested dynamically only if the user enables the "Frequent Sites" folder, used to fetch and display the user's most frequently visited pages.

- **Optional host permissions:** requested for link review, local preview capture, or the optional Weather and Sports widgets. Widget requests use Open-Meteo and ESPN hosts. Link review and preview capture share broad URL permissions, which martabs attempts to remove when both features are disabled.

## Network activity

Feature-specific network activity is limited to features you enable or start, with the favicon requests described below occurring while bookmarks are displayed. The Weather widget sends the configured city query to Open-Meteo's geocoding service and then requests weather for the latitude and longitude returned by that service. The Sports widget requests the selected league's scores from ESPN. Team logo images shown by the Sports widget are loaded from URLs supplied in ESPN responses. When local statistics are displayed, domain icon images may be loaded from `s2.googleusercontent.com` using domains from local visit statistics. These providers may receive normal network metadata such as your IP address, user agent and request time. martabs does not send bookmarks, tags or bookmark organization data to widget providers.

In Firefox, the default favicon fallback requests `/favicon.ico` from the origin of each bookmark URL while bookmarks are displayed. Custom favicon URLs are loaded only when configured by the user. If link review is enabled and started by the user, martabs may make direct requests to the bookmarked URLs to determine whether they are reachable. If local preview capture is enabled, martabs may capture a page opened from martabs after it loads in the browser.

## Data sharing

martabs does not sell or rent user data. External requests, including favicon requests while displaying bookmarks, are described in the Network activity section.

## Data deletion

You can remove local extension data by uninstalling the extension or clearing extension data from the browser. martabs also includes settings actions to clear cached previews and reset local organization data.

## Contact

For questions or privacy requests, contact martabs.extension@gmail.com.
