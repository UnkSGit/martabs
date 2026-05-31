# Demo Video Implementation Plan

**Status:** Proposed  
**Target version:** Future release  
**Owner:** Codex / Gemini / Antigravity  
**Last updated:** 2026-05-31

## Goal

Create a short, repeatable demo video of the martabs interface using Playwright. The video should show the real dashboard flow without exposing personal bookmarks, and should be suitable for the README, GitHub Pages, and store listing support material.

## Desired Result

- A generated video file at `docs/assets/demo/martabs-demo.webm`.
- Optional converted copy at `docs/assets/demo/martabs-demo.mp4` if needed later for stores or social previews.
- A deterministic Playwright test that can regenerate the video.
- No personal URLs, folder names, emails, browser profile data, or private bookmarks visible.

## Recommended Video Flow

Target duration: 35 to 55 seconds.

1. Open martabs on the new tab dashboard.
2. Pause briefly on the main dashboard so the logo, bookmark counter, folders, and layout are visible.
3. Use search with a short mock query.
4. Clear the search.
5. Change the view mode of one folder from the folder header button.
6. Open Settings.
7. Navigate to Appearance.
8. Select the Gradient background mode.
9. Pick a visually clear gradient preset.
10. Optionally enable or show Aurora animation if it is visible without becoming distracting.
11. Save changes.
12. Return to the dashboard.
13. Pause on the final dashboard with the gradient applied.

## Technical Approach

Use Playwright video recording rather than manual screen recording. This keeps the demo reproducible and prevents accidental exposure of real data.

Recommended new file:

- `e2e/tests/demo-video.spec.mjs`

Recommended output folder:

- `docs/assets/demo/`

The test should:

- Launch Chromium or Chrome with the extension loaded.
- Use a temporary browser profile.
- Seed mock bookmarks and settings, following existing E2E test helpers if available.
- Record video with Playwright context options.
- Run deliberate, visible interactions with short pauses.
- Save or copy the final `.webm` into `docs/assets/demo/martabs-demo.webm`.

Use Chromium/Chrome for this video even though martabs supports Firefox. Extension automation and video generation are more stable in Chromium, and the goal is to demonstrate the UI rather than browser-specific behavior.

## Mock Data

Do not use the maintainer's real bookmark tree.

Use a small curated set of folders and bookmarks:

- Development
- Design
- Learning
- Productivity
- Reference

Recommended mock bookmarks:

- GitHub
- MDN Web Docs
- Stack Overflow
- Figma
- Google Calendar
- Notion
- Wikipedia
- Hacker News
- OpenAI
- Firefox Add-ons

Use public URLs only. Avoid any private domains, local IPs, personal dashboards, or work systems.

## Playwright Details

Preferred viewport:

```js
viewport: { width: 1440, height: 900 }
```

Recommended video size:

```js
recordVideo: {
  dir: "test-results/demo-video",
  size: { width: 1440, height: 900 }
}
```

The flow should use small pauses to make the video readable:

```js
await page.waitForTimeout(800);
```

For important UI states, use assertions before continuing. The goal is not only to record a video, but to fail if the demo flow breaks.

Examples:

```js
await expect(page.locator("#search")).toBeVisible();
await expect(page.locator(".folder-card").first()).toBeVisible();
await expect(page.locator("#settings")).toBeVisible();
```

## Suggested Test Structure

```js
import { test, expect } from "@playwright/test";

test("records martabs demo video", async ({ context, page }) => {
  // 1. Seed mock bookmarks/settings.
  // 2. Open the extension new tab page.
  // 3. Record a clean UI tour:
  //    - dashboard
  //    - search
  //    - folder view change
  //    - settings
  //    - appearance
  //    - gradient preset
  //    - save
  //    - return dashboard
  // 4. Copy the generated video to docs/assets/demo/martabs-demo.webm.
});
```

Implementation should reuse existing E2E extension loading helpers if the project already has them. If no helper exists for a clean profile with mock bookmarks, create the smallest possible local helper inside `e2e/tests/demo-video.spec.mjs` or a shared E2E helper file if duplication becomes obvious.

## Commands

Run only the demo video test:

```powershell
$env:CHROME_EXECUTABLE_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
& "C:\Users\Gabriel\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\@playwright\test\cli.js test e2e/tests/demo-video.spec.mjs --project=chromium
```

Run full unit tests after implementation:

```powershell
& "C:\Users\Gabriel\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --test
```

Run the normal build:

```powershell
& "C:\Users\Gabriel\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts/build.mjs
```

## Optional MP4 Conversion

Playwright produces `.webm`. Keep `.webm` as the source artifact.

If an `.mp4` is needed later, convert with `ffmpeg` outside the core test:

```powershell
ffmpeg -i docs/assets/demo/martabs-demo.webm -vf "fps=30,scale=1440:-2" -c:v libx264 -pix_fmt yuv420p docs/assets/demo/martabs-demo.mp4
```

Do not make `ffmpeg` a required dependency for the normal test suite unless the project explicitly decides to support MP4 generation as part of release automation.

## Quality Checklist

Before committing the generated video:

- The video is between 35 and 55 seconds.
- The video is not blank or partially black.
- No personal bookmarks, private URLs, emails, or local IPs are visible.
- The UI language is intentional, preferably English for public-facing material.
- The dashboard appears at the beginning and end.
- The gradient background change is visible.
- The settings screen does not show confusing intermediate states.
- The file size is reasonable for a repository asset.
- The video plays locally in a browser.

## README Integration

After the video exists, update `README.md` with either:

```md
![martabs demo](docs/assets/demo/martabs-demo.webm)
```

or a link if GitHub rendering is inconsistent:

```md
[Watch the martabs demo](docs/assets/demo/martabs-demo.webm)
```

If GitHub Pages is used for the public project page, prefer embedding the `.webm` with a `<video controls muted loop>` element in the pages source.

## Risks And Notes

- Playwright video output is tied to the browser context lifecycle. The test must close the context before copying the generated video.
- Firefox should not be used as the primary recorder for this flow; Chromium is more predictable for extension video recording.
- The demo should not depend on timing-sensitive animations. Use assertions plus short waits.
- Aurora animation may be too subtle in compressed video. If it does not read clearly, select a bold static gradient preset and leave Aurora disabled.
- Avoid using this test as part of every CI run if it becomes slow. It can be a manual release-generation test.

## Suggested Future Automation

If the demo becomes part of every release, add a script:

```json
"demo:video": "playwright test e2e/tests/demo-video.spec.mjs --project=chromium"
```

For now, keep it manual to avoid adding release friction.
