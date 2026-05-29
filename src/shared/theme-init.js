// Early theme detection to minimize visual flash of wrong theme
(function() {
  try {
    const api = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) ? chrome : (typeof browser !== "undefined" && browser.storage && browser.storage.local ? browser : null);
    if (api) {
      const cb = function(data) {
        try {
          const theme = data?.settings?.theme || "system";
          const root = document.documentElement;
          if (theme === "dark") {
            root.classList.add("theme-dark");
            root.classList.remove("theme-light");
          } else if (theme === "light") {
            root.classList.add("theme-light");
            root.classList.remove("theme-dark");
          }
        } catch (e) {}
      };
      const res = api.storage.local.get("settings", cb);
      if (res && typeof res.then === "function") {
        res.then(cb, function() {});
      }
    }
  } catch (e) {}
})();
