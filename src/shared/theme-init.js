// Early theme detection to minimize visual flash of wrong theme
(function() {
  try {
    const api = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) ? chrome : (typeof browser !== "undefined" && browser.storage && browser.storage.local ? browser : null);
    if (api) {
      const cb = function(data) {
        try {
          let theme = data?.settings?.theme || "system";
          const settings = data?.settings || {};
          
          if (settings.customWallpaperEnabled && settings.customWallpaperSlots && settings.customWallpaperSlots.length > 0) {
            let activeSlot = settings.customWallpaperActiveSlot || 1;
            if (settings.customWallpaperRotate) {
              let storedSlot = sessionStorage.getItem("selectedWallpaperSlot");
              if (storedSlot && settings.customWallpaperSlots.includes(Number(storedSlot))) {
                activeSlot = Number(storedSlot);
              } else {
                const randIndex = Math.floor(Math.random() * settings.customWallpaperSlots.length);
                activeSlot = settings.customWallpaperSlots[randIndex];
                sessionStorage.setItem("selectedWallpaperSlot", activeSlot);
              }
            } else {
              sessionStorage.removeItem("selectedWallpaperSlot");
            }
            theme = settings.customWallpaperThemes?.[activeSlot] || "dark";
            if (theme === "system") {
              theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
          }
          
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
