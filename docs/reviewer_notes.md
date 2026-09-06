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

martabs stores data locally in browser extension storage and IndexedDB. It does not use telemetry, analytics, remote databases or external preview services. Optional Weather and Sports widgets use Open-Meteo and ESPN, and sports logos are loaded from URLs in ESPN responses. Local statistics may load domain icons from s2.googleusercontent.com. Firefox also requests bookmark-origin favicon.ico files. See the public privacy policy for details.

## Version 1.0.1 regression checks

- Enable Notes and Checklist in Widgets, save, and open two dashboard tabs. Add a task from each tab and verify both tasks remain visible. Toggle or delete a task and verify the other tab updates.
- Type a note and immediately close that dashboard tab. Reopen it and verify the latest text remains.
- Export settings with custom tabs, widget options, language and a gradient background, change those options, and import the backup. Verify the saved configuration is restored.
- No account or credentials are needed to test the extension. Weather and Sports are optional and request their host permissions only when enabled.
- The uploaded packages contain readable, unminified JavaScript modules. The build copies source files and combines the shared and browser-specific manifests; it does not bundle, transpile or obfuscate code.
- Configuration backups do not contain wallpaper image blobs, notes, checklist content or click statistics. Existing wallpaper blobs in the same profile are retained when available.

## Browser differences

Chrome uses the `favicon` permission to display browser-provided favicons.

Firefox does not support Chrome's internal favicon endpoint, so martabs uses a lightweight `/favicon.ico` fallback and then a local visual fallback if needed.
