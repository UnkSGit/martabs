import { test as base, chromium, firefox } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.join(__dirname, '../../dist/chrome');

export const test = base.extend({
  context: async ({ browserName }, use) => {
    let context;
    if (browserName === 'chromium') {
      context = await chromium.launchPersistentContext('', {
        headless: false,
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
        ],
      });
    } else if (browserName === 'firefox') {
      // Nota: Firefox con addon temporal requiere configuraciones específicas
      // y no soporta cargar extensiones MV3 directo por command line tan fácil en Playwright.
      // Por ahora, configuraremos un perfil que permita addons sin firmar.
      // Más adelante usaremos web-ext si es necesario.
      context = await firefox.launchPersistentContext('', {
        headless: false,
        firefoxUserPrefs: {
          "xpinstall.signatures.required": false,
          "extensions.autoDisableScopes": 0
        }
      });
      // TODO: En Firefox hay que instalar el addon dinámicamente si no se puede por args.
    }
    
    await use(context);
    await context.close();
  },
  extensionId: async ({ context, browserName }, use) => {
    let extensionId = '';
    if (browserName === 'chromium') {
      // Para Chromium, podemos buscar en el target de background
      let [background] = context.serviceWorkers();
      if (!background)
        background = await context.waitForEvent('serviceworker');

      const extensionUrl = background.url();
      extensionId = extensionUrl.split('/')[2];
    } else if (browserName === 'firefox') {
      // TODO: obtener extension ID para Firefox
    }
    await use(extensionId);
  },
});

export const expect = test.expect;
