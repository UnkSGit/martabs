import { test as base, chromium, firefox } from '@playwright/test';
import { withExtension } from 'playwright-webextext';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chromeExtensionPath = path.join(__dirname, '../../dist/chrome');
const firefoxExtensionPath = path.join(__dirname, '../../dist/firefox');

import fs from 'fs';
import os from 'os';

const FIREFOX_UUID = 'eb84f5bc-695d-4f11-9a74-98440f6b4d32';

export const test = base.extend({
  context: async ({ browserName }, use) => {
    let context;
    let userDataDir = '';
    
    if (browserName === 'chromium') {
      context = await chromium.launchPersistentContext('', {
        headless: false,
        locale: 'es-ES',
        executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
        args: [
          `--disable-extensions-except=${chromeExtensionPath}`,
          `--load-extension=${chromeExtensionPath}`,
        ],
      });
    } else if (browserName === 'firefox') {
      userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-firefox-'));
      const browserTypeWithExtension = withExtension(firefox, firefoxExtensionPath);
      context = await browserTypeWithExtension.launchPersistentContext(userDataDir, {
        headless: false,
        locale: 'es-ES',
        firefoxUserPrefs: {
          'extensions.webextensions.uuids': JSON.stringify({"martabs@example.local": FIREFOX_UUID})
        }
      });
    }
    
    await use(context);
    await context.close();
    if (userDataDir) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  },
  extensionId: async ({ context, browserName }, use) => {
    let extensionId = '';
    if (browserName === 'chromium') {
      let [background] = context.serviceWorkers();
      if (!background)
        background = await context.waitForEvent('serviceworker');

      const extensionUrl = background.url();
      extensionId = extensionUrl.split('/')[2];
    } else if (browserName === 'firefox') {
      extensionId = FIREFOX_UUID;
    }
    await use(extensionId);
  },
  extensionProtocol: async ({ browserName }, use) => {
    await use(browserName === 'firefox' ? 'moz-extension://' : 'chrome-extension://');
  },
});

export const expect = test.expect;
