export function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child !== null && child !== undefined && child !== false) {
      node.append(child);
    }
  }
  return node;
}

export function formatDate(timestamp) {
  if (!timestamp) return "";
  let locale = "es";
  try {
    const api = globalThis.browser || globalThis.chrome;
    const uiLocale = api?.i18n?.getMessage("@@ui_locale");
    if (uiLocale) {
      locale = uiLocale.split(/[_-]/)[0].toLowerCase();
    } else if (navigator.language) {
      locale = navigator.language.split(/[_-]/)[0].toLowerCase();
    }
  } catch (error) {
    // Mantener es como fallback
  }
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(timestamp);
}
