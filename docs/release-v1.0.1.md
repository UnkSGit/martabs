# martabs v1.0.1

This release publishes the accumulated dashboard and widget improvements and fixes data persistence and configuration restoration.

## Changes

- Add configurable Clock, Weather, Sports, Notes and Checklist widgets, saved widget order, and compact presentation.
- Preserve checklist tasks when multiple dashboard tabs add or update them at the same time. Synchronize changes across tabs and retain existing tasks from older versions.
- Save notes immediately through the background process so closing a tab does not discard the latest edit.
- Prevent delayed reads and overlapping widget initialization from overwriting edits or duplicating storage listeners.
- Restore language, custom tabs, widget settings, gradient backgrounds, local statistics settings and other current options from configuration backups.
- Preserve omitted options when importing older backups, replace explicitly supplied organization maps, and validate imported fields and optional permissions.
- Retain existing wallpaper images when importing in the same browser profile. Configuration JSON does not include image blobs, notes, checklist content or click statistics.
- Improve setup presentation, accessibility labels, translations and store artwork.
- Update privacy documentation to describe optional Open-Meteo and ESPN requests, team logos and favicon requests.
- Make the unit-test command compatible with Node.js 24.

## Packages

- `martabs-chrome-v1.0.1.zip`: upload to the existing Chrome Web Store item, or extract and load unpacked for local testing.
- `martabs-firefox-v1.0.1.zip`: upload to the existing Mozilla Add-ons item. This is an unsigned submission package; Mozilla signs the accepted version.

## Verification

- 103 unit tests passed.
- 34 selected Chromium browser tests passed, including seven persistence/import regression scenarios.
- Translation consistency check passed.
- Chrome and Firefox packages built successfully.
- Mozilla web-ext 10.6.0 validation: zero errors, warnings or notices.
- Firefox runtime testing remains limited by the existing extension test fixture.

Store submission is manual for this release. Publishing the GitHub release does not publish an update in either browser store.
