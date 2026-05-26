# martabs Reviewer Notes

martabs is a local-first bookmark dashboard extension.

## How to test

1. Install the extension package.
2. Open the extension options page.
3. Select one or more bookmark folders.
4. Save settings.
5. Open a new tab to view the dashboard.
6. Search bookmarks, change folder visual modes, pin bookmarks and open the edit dialog.

## Optional features

Link review and local preview capture are disabled by default.

If enabled, both features may request optional host permissions:

- Link review checks bookmarked URLs only when the user clicks the review button.
- Local preview capture runs only for bookmarks opened from martabs and only when the option is enabled.

martabs does not monitor general browsing activity.

## Privacy model

martabs stores data locally in the browser. It does not use telemetry, analytics, remote databases, external preview services, external favicon services or third-party metadata services.

## Browser differences

Chrome uses the `favicon` permission to display browser-provided favicons.

Firefox does not support Chrome's internal favicon endpoint, so martabs uses a lightweight `/favicon.ico` fallback and then a local visual fallback if needed.
