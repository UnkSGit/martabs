// Early theme detection to minimize visual flash of wrong theme
(function() {
  try {
    const api = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) ? chrome : (typeof browser !== "undefined" && browser.storage && browser.storage.local ? browser : null);
    if (api) {
      const cb = function(data) {
        try {
          let theme = data?.settings?.theme || "system";
          const settings = data?.settings || {};

          const isGradient = settings.customWallpaperType === "gradient";
          const hasImage = (settings.customWallpaperType === "image" || !settings.customWallpaperType) && settings.customWallpaperSlots && settings.customWallpaperSlots.length > 0;

          if (settings.customWallpaperEnabled && (isGradient || hasImage)) {
            let activeSlot = settings.customWallpaperActiveSlot || 1;
            if (!isGradient && settings.customWallpaperRotate && settings.customWallpaperSlots && settings.customWallpaperSlots.length > 0) {
              let storedSlot = sessionStorage.getItem("selectedWallpaperSlot");
              if (storedSlot && settings.customWallpaperSlots.includes(Number(storedSlot))) {
                activeSlot = Number(storedSlot);
              } else {
                const randIndex = Math.floor(Math.random() * settings.customWallpaperSlots.length);
                activeSlot = settings.customWallpaperSlots[randIndex];
                sessionStorage.setItem("selectedWallpaperSlot", activeSlot);
              }
            } else if (!isGradient) {
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
