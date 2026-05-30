import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/_locales');
const baseLocale = 'es';
const baseFilePath = path.join(localesDir, baseLocale, 'messages.json');
const manifestPath = path.resolve(__dirname, '../src/manifest.base.json');

const args = process.argv.slice(2);
const isWriteMode = args.includes('--write');
const isCheckMode = args.includes('--check') || !isWriteMode;

function exitWithError(msg) {
  console.error(`\x1b[31m[i18n Error] ${msg}\x1b[0m`);
  process.exit(1);
}

// 1. Load Base Locale
if (!fs.existsSync(baseFilePath)) {
  exitWithError(`Base locale file not found at: ${baseFilePath}`);
}

let baseData;
try {
  baseData = JSON.parse(fs.readFileSync(baseFilePath, 'utf8'));
} catch (err) {
  exitWithError(`Failed to parse base locale file: ${err.message}`);
}

const baseKeys = Object.keys(baseData);

// 2. Validate manifest.base.json default_locale
if (!fs.existsSync(manifestPath)) {
  exitWithError(`manifest.base.json not found at: ${manifestPath}`);
}

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const defaultLocale = manifest.default_locale;
  if (!defaultLocale) {
    exitWithError('manifest.base.json is missing "default_locale" field.');
  }
  const defaultLocalePath = path.join(localesDir, defaultLocale, 'messages.json');
  if (!fs.existsSync(defaultLocalePath)) {
    exitWithError(`manifest.base.json specifies default_locale "${defaultLocale}", but directory "${defaultLocalePath}" does not exist.`);
  }
} catch (err) {
  exitWithError(`Failed to parse manifest: ${err.message}`);
}

// 3. Scan Locales
const locales = fs.readdirSync(localesDir).filter(name => {
  const stat = fs.statSync(path.join(localesDir, name));
  return stat.isDirectory();
});

let globalErrors = [];
let globalWarnings = [];

// Helper to extract tokens like $COUNT$, $FOLDER$, $1, $DATE$ etc.
function extractTokens(str) {
  if (!str) return [];
  const matches = str.match(/\$[A-Z0-9_]+\$/g);
  return matches ? matches.map(m => m.toUpperCase()) : [];
}

locales.forEach(locale => {
  const localeFilePath = path.join(localesDir, locale, 'messages.json');
  if (!fs.existsSync(localeFilePath)) {
    globalErrors.push(`Locale file not found for "${locale}" at: ${localeFilePath}`);
    return;
  }

  let localeContent = fs.readFileSync(localeFilePath, 'utf8');
  let localeData;
  try {
    localeData = JSON.parse(localeContent);
  } catch (err) {
    globalErrors.push(`Locale "${locale}" contains invalid JSON: ${err.message}`);
    return;
  }

  const localeKeys = Object.keys(localeData);
  
  // Checks
  const missingKeys = baseKeys.filter(k => !localeKeys.includes(k));
  const orphanKeys = localeKeys.filter(k => !baseKeys.includes(k));
  
  // Check ordering
  let isOrdered = true;
  for (let i = 0; i < localeKeys.length - 1; i++) {
    if (localeKeys[i] > localeKeys[i + 1]) {
      isOrdered = false;
      break;
    }
  }

  // Placeholder and Token checking for matched keys
  const matchedKeys = baseKeys.filter(k => localeKeys.includes(k));
  matchedKeys.forEach(key => {
    const baseEntry = baseData[key];
    const localeEntry = localeData[key];

    // Check message presence
    if (typeof localeEntry.message !== 'string') {
      globalErrors.push(`[${locale}] Key "${key}" is missing the "message" string.`);
      return;
    }

    // Check placeholders metadata block
    const basePlaceholders = baseEntry.placeholders || {};
    const localePlaceholders = localeEntry.placeholders || {};
    const basePlaceholderKeys = Object.keys(basePlaceholders).sort();
    const localePlaceholderKeys = Object.keys(localePlaceholders).sort();

    if (JSON.stringify(basePlaceholderKeys) !== JSON.stringify(localePlaceholderKeys)) {
      globalErrors.push(`[${locale}] Key "${key}" placeholders metadata keys mismatch. Expected: [${basePlaceholderKeys.join(', ')}], Got: [${localePlaceholderKeys.join(', ')}]`);
    } else {
      // Validate contents of placeholders metadata
      basePlaceholderKeys.forEach(pKey => {
        if (basePlaceholders[pKey].content !== localePlaceholders[pKey].content) {
          globalErrors.push(`[${locale}] Key "${key}" placeholder "${pKey}" content mismatch. Expected: "${basePlaceholders[pKey].content}", Got: "${localePlaceholders[pKey].content}"`);
        }
      });
    }

    // Check embedded tokens in translated message
    const baseTokens = extractTokens(baseEntry.message);
    const localeTokens = extractTokens(localeEntry.message);
    
    const missingTokens = baseTokens.filter(t => !localeTokens.includes(t));
    if (missingTokens.length > 0) {
      globalErrors.push(`[${locale}] Key "${key}" message is missing required tokens: ${missingTokens.join(', ')}. Translation: "${localeEntry.message}"`);
    }

    // Check for [TODO] translations
    if (localeEntry.message.startsWith('[TODO]')) {
      globalWarnings.push(`[${locale}] Key "${key}" has pending translation: "${localeEntry.message}"`);
    }
  });

  // Mode: WRITE
  if (isWriteMode) {
    let modified = false;
    let newLocaleData = {};

    // 1. Clean orphans and copy keys (including missing)
    baseKeys.forEach(key => {
      if (localeKeys.includes(key)) {
        const baseEntry = baseData[key];
        const localeEntry = localeData[key];
        
        // Sync placeholders metadata from base to target
        const basePlaceholdersStr = baseEntry.placeholders ? JSON.stringify(baseEntry.placeholders) : null;
        const localePlaceholdersStr = localeEntry.placeholders ? JSON.stringify(localeEntry.placeholders) : null;
        
        if (basePlaceholdersStr !== localePlaceholdersStr) {
          const updatedEntry = JSON.parse(JSON.stringify(localeEntry));
          if (baseEntry.placeholders) {
            updatedEntry.placeholders = JSON.parse(basePlaceholdersStr);
          } else {
            delete updatedEntry.placeholders;
          }
          newLocaleData[key] = updatedEntry;
          modified = true;
        } else {
          newLocaleData[key] = localeEntry;
        }
      } else {
        // Deep copy key structure
        const copiedEntry = JSON.parse(JSON.stringify(baseData[key]));
        copiedEntry.message = `[TODO] ${copiedEntry.message}`;
        newLocaleData[key] = copiedEntry;
        modified = true;
      }
    });

    // Sort alphabetically
    const sortedKeys = Object.keys(newLocaleData).sort();
    const sortedData = {};
    sortedKeys.forEach(k => {
      sortedData[k] = newLocaleData[k];
    });

    if (!isOrdered || JSON.stringify(Object.keys(localeData)) !== JSON.stringify(sortedKeys)) {
      modified = true;
    }

    if (modified || localeContent !== JSON.stringify(sortedData, null, 2)) {
      fs.writeFileSync(localeFilePath, JSON.stringify(sortedData, null, 2) + '\n', 'utf8');
      console.log(`\x1b[32m[i18n Maintain] Updated and sorted: ${locale}\x1b[0m`);
    }
  } else {
    // Mode: CHECK
    if (missingKeys.length > 0) {
      globalErrors.push(`[${locale}] Missing keys: ${missingKeys.join(', ')}`);
    }
    if (orphanKeys.length > 0) {
      globalErrors.push(`[${locale}] Orphan/Obsolete keys: ${orphanKeys.join(', ')}`);
    }
    if (!isOrdered) {
      globalErrors.push(`[${locale}] Keys are not sorted alphabetically.`);
    }
  }
});

// Final report
if (isCheckMode) {
  if (globalErrors.length > 0 || globalWarnings.length > 0) {
    console.log(`\n--- i18n Audit Report ---`);
    globalWarnings.forEach(w => console.warn(`\x1b[33m[Warning] ${w}\x1b[0m`));
    globalErrors.forEach(e => console.error(`\x1b[31m[Error] ${e}\x1b[0m`));
    
    const totalIssues = globalErrors.length + globalWarnings.length;
    exitWithError(`Audit failed with ${globalErrors.length} error(s) and ${globalWarnings.length} warning(s). All [TODO] pending translations must be resolved before committing/pushing.`);
  } else {
    console.log(`\x1b[32m[i18n Success] All translations are fully synchronized, sorted, and consistent!\x1b[0m`);
  }
}
