let customTranslations = null;

const LANGUAGE_ALIASES = {
  zh: "zh_CN",
  pt: "pt_BR"
};

export function normalizeLanguageCode(language) {
  return LANGUAGE_ALIASES[language] || language;
}

export async function initI18n(api, userLanguage) {
  const language = normalizeLanguageCode(userLanguage);

  if (!language || language === "system") {
    customTranslations = null;
    return;
  }

  try {
    const url = `../_locales/${language}/messages.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load");
    const messages = await response.json();

    let fallbackMessages = {};
    if (language !== "es") {
      try {
        const fallbackUrl = `../_locales/es/messages.json`;
        const fallbackResponse = await fetch(fallbackUrl);
        if (fallbackResponse.ok) {
          fallbackMessages = await fallbackResponse.json();
        }
      } catch (e) {
        // Ignore fallback loading errors
      }
    }

    customTranslations = {
      messages,
      fallbackMessages,
      langCode: language
    };
  } catch (err) {
    customTranslations = null;
  }
}

export function getMessage(api, key, substitutions) {
  if (customTranslations) {
    if (key === "@@ui_locale") {
      return customTranslations.langCode;
    }
    let entry = customTranslations.messages[key];
    if (!entry && customTranslations.fallbackMessages) {
      entry = customTranslations.fallbackMessages[key];
    }
    if (entry) {
      let message = entry.message || "";
      if (substitutions && entry.placeholders) {
        const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
        Object.entries(entry.placeholders).forEach(([name, placeholderObj]) => {
          const contentStr = placeholderObj.content || "";
          const match = contentStr.match(/^\$(\d+)$/);
          if (match) {
            const subIndex = parseInt(match[1], 10) - 1;
            if (subIndex >= 0 && subIndex < subs.length) {
              const replacement = subs[subIndex];
              const regex = new RegExp(`\\$${name}\\$`, "gi");
              message = message.replace(regex, replacement);
            }
          }
        });
      } else if (substitutions) {
        const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
        subs.forEach((sub, index) => {
          message = message.replaceAll(`$${index + 1}`, sub);
        });
      }
      return message;
    }
  }
  return api.i18n.getMessage(key, substitutions);
}

export function localizeHtml(api, rootElement = document) {
  // Ajustar lang del documento basandose en el locale actual
  const uiLocale = getMessage(api, "@@ui_locale");
  if (uiLocale) {
    const langCode = uiLocale.split(/[_-]/)[0].toLowerCase();
    const ownerDocument = rootElement.ownerDocument || document;
    ownerDocument.documentElement.lang = langCode || "es";
    if (langCode === "ar") {
      ownerDocument.documentElement.dir = "rtl";
    } else {
      ownerDocument.documentElement.dir = "ltr";
    }
  }

  // Traducir texto directo
  rootElement.querySelectorAll("[data-i18n]").forEach(el => {
    const msg = getMessage(api, el.dataset.i18n);
    if (msg) el.textContent = msg;
  });

  // Traducir placeholders
  rootElement.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const msg = getMessage(api, el.dataset.i18nPlaceholder);
    if (msg) el.placeholder = msg;
  });

  // Traducir titulos
  rootElement.querySelectorAll("[data-i18n-title]").forEach(el => {
    const msg = getMessage(api, el.dataset.i18nTitle);
    if (msg) el.title = msg;
  });

  // Combinar data-search original con terminos adicionales traducidos sin pisar todo
  rootElement.querySelectorAll("[data-i18n-search]").forEach(el => {
    const msg = getMessage(api, el.dataset.i18nSearch);
    if (msg) {
      const originalSearch = el.dataset.search || "";
      el.dataset.search = `${originalSearch} ${msg}`.trim();
    }
  });
}

// Helper corto para traducciones dinamicas en JS con fallback
export function t(api, key, substitutions) {
  return getMessage(api, key, substitutions) || key;
}
