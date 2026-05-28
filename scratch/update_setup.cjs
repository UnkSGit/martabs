const fs = require('fs');
let content = fs.readFileSync('src/setup/setup.js', 'utf8');

// 1. Add DOM elements
content = content.replace(
  'const previewCapture = document.querySelector("#preview-capture");',
  'const previewCapture = document.querySelector("#preview-capture");\nconst frequentSites = document.querySelector("#frequent-sites");\nconst localStats = document.querySelector("#local-stats");\nconst statsChart = document.querySelector("#stats-chart");\nconst storageAudit = document.querySelector("#storage-audit");\nconst resetStatsBtn = document.querySelector("#reset-stats");\nconst downloadStatsBtn = document.querySelector("#download-stats");'
);

// 2. Add topSites permissions
content = content.replace(
  'const urlPermissions = {',
  'const topSitesPermissions = { permissions: ["topSites"] };\n\nconst urlPermissions = {'
);

// 3. Add permission functions
content = content.replace(
  'async function requestUrlPermission() {',
  'async function requestTopSitesPermission() {\n  if (!api.permissions?.request) return false;\n  try { return await api.permissions.request(topSitesPermissions); } catch { return false; }\n}\n\nasync function requestUrlPermission() {'
);

// 4. Update init checkboxes
content = content.replace(
  'previewCapture.checked = currentSettings.previewCaptureEnabled;',
  'previewCapture.checked = currentSettings.previewCaptureEnabled;\n  frequentSites.checked = currentSettings.showTopSitesFolder;\n  localStats.checked = currentSettings.localStatsEnabled;\n\n  if (currentSettings.localStatsEnabled) {\n    renderStatistics();\n  }'
);

// 5. Update collectSettingsFromForm
content = content.replace(
  'function collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled) {',
  'function collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled, showTopSitesFolder, localStatsEnabled) {'
);
content = content.replace(
  'previewCaptureEnabled: previewCaptureEnabled,',
  'previewCaptureEnabled: previewCaptureEnabled,\n    showTopSitesFolder: showTopSitesFolder,\n    localStatsEnabled: localStatsEnabled,'
);

// 6. Update Save Button flow
content = content.replace(
  'const previewCaptureRequested = previewCapture.checked;',
  'const previewCaptureRequested = previewCapture.checked;\n    const frequentSitesRequested = frequentSites.checked;\n    const localStatsRequested = localStats.checked;'
);
content = content.replace(
  'const previewCaptureEnabled = previewCaptureRequested && urlPermissionGranted;',
  'const previewCaptureEnabled = previewCaptureRequested && urlPermissionGranted;\n    const topSitesPermissionGranted = frequentSitesRequested ? await requestTopSitesPermission() : false;\n    const showTopSitesFolder = frequentSitesRequested && topSitesPermissionGranted;'
);
content = content.replace(
  'if (!previewCaptureEnabled) {\n      previewCapture.checked = false;\n    }',
  'if (!previewCaptureEnabled) {\n      previewCapture.checked = false;\n    }\n    if (!showTopSitesFolder) {\n      frequentSites.checked = false;\n    }'
);
content = content.replace(
  'currentSettings = collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled);',
  'currentSettings = collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled, showTopSitesFolder, localStatsRequested);\n    if (localStatsRequested) renderStatistics();'
);

// 7. Add renderStatistics
content += `\n\nasync function renderStatistics() {
  if (!statsChart || !storageAudit) return;
  statsChart.innerHTML = "";
  storageAudit.innerHTML = "";
  const data = await api.storage.local.get(STORAGE_KEYS.clickStats);
  const clickStats = data[STORAGE_KEYS.clickStats] || [];
  if (clickStats.length === 0) {
    statsChart.innerHTML = \`<p>\${t(api, "emptyResults")}</p>\`;
  } else {
    const counts = {};
    const titles = {};
    clickStats.forEach(stat => {
      counts[stat.bookmarkId] = (counts[stat.bookmarkId] || 0) + 1;
      titles[stat.bookmarkId] = stat.title || stat.url || "Unknown";
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCount = sorted[0][1];
    sorted.forEach(([id, count]) => {
      const percentage = (count / maxCount) * 100;
      statsChart.innerHTML += \`
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">\${titles[id]}</span>
            <span>\${count}</span>
          </div>
          <div style="width: 100%; height: 6px; background-color: var(--hover-color); border-radius: 3px; overflow: hidden;">
            <div style="width: \${percentage}%; height: 100%; background-color: var(--accent-color);"></div>
          </div>
        </div>
      \`;
    });
  }
  try {
    const allStorage = await api.storage.local.get(null);
    let totalBytes = 0;
    for (const [key, value] of Object.entries(allStorage)) {
      const size = new Blob([JSON.stringify(value)]).size;
      totalBytes += size;
      storageAudit.innerHTML += \`
        <div style="display: flex; justify-content: space-between; padding: 8px; background-color: var(--card-bg); border-radius: 6px; border: 1px solid var(--border-color);">
          <span style="font-size: 13px;">\${key}</span>
          <span style="font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums;">\${(size / 1024).toFixed(1)} KB</span>
        </div>
      \`;
    }
    storageAudit.innerHTML += \`
      <div style="display: flex; justify-content: space-between; padding: 8px; background-color: var(--hover-color); border-radius: 6px; border: 1px solid var(--border-color); font-weight: 500;">
        <span style="font-size: 13px;">Total</span>
        <span style="font-size: 13px; font-variant-numeric: tabular-nums;">\${(totalBytes / 1024).toFixed(1)} KB</span>
      </div>
    \`;
  } catch (e) {
    storageAudit.innerHTML = \`<p>Error loading storage.</p>\`;
  }
}

if (resetStatsBtn) {
  resetStatsBtn.addEventListener("click", async () => {
    if (confirm(t(api, "confirmResetStats"))) {
      await api.storage.local.set({ [STORAGE_KEYS.clickStats]: [] });
      renderStatistics();
    }
  });
}

if (downloadStatsBtn) {
  downloadStatsBtn.addEventListener("click", async () => {
    const data = await api.storage.local.get(STORAGE_KEYS.clickStats);
    const clickStats = data[STORAGE_KEYS.clickStats] || [];
    const blob = new Blob([JSON.stringify(clickStats, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "martabs_click_stats.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
`;

fs.writeFileSync('src/setup/setup.js', content, 'utf8');
console.log('setup.js updated.');
