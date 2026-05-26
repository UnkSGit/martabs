export class SetupPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} extensionUrlPrefix
   */
  constructor(page, extensionUrlPrefix) {
    this.page = page;
    this.url = `${extensionUrlPrefix}${extensionUrlPrefix.endsWith('/') ? '' : '/'}setup/setup.html`;
    
    // Selectors
    this.saveBtn = page.locator('#save');
    this.statusText = page.locator('#status');
    this.toggleAllBtn = page.locator('#toggle-all-folders');
    this.searchInput = page.locator('#settings-search');
    this.exportBtn = page.locator('#export-config');
    this.importBtn = page.locator('#import-config');
    this.importFileInput = page.locator('#import-config-file');
    this.importSummary = page.locator('#import-summary-container');
    this.importSummaryText = page.locator('#import-summary-text');
    this.importConfirmBtn = page.locator('#import-confirm-btn');
    this.importCancelBtn = page.locator('#import-cancel-btn');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async navigateToSection(sectionId) {
    await this.page.locator(`button.setup-nav-button[data-section="${sectionId}"]`).click();
  }

  getFolderCheckbox(folderId) {
    return this.page.locator(`input[type="checkbox"][value="${folderId}"]`);
  }

  async selectFolder(folderId) {
    const checkbox = this.getFolderCheckbox(folderId);
    await checkbox.waitFor({ state: 'visible' });
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
  }

  async deselectFolder(folderId) {
    const checkbox = this.getFolderCheckbox(folderId);
    await checkbox.waitFor({ state: 'visible' });
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }

  async toggleAllFolders() {
    await this.toggleAllBtn.click();
  }

  async searchSettings(text) {
    await this.searchInput.fill(text);
  }

  async save() {
    await this.saveBtn.click();
    // Esperar a que el status diga "Configuración guardada"
    await this.statusText.waitFor({ state: 'visible' });
  }

  // Métodos de Importar/Exportar
  async exportarConfiguracion() {
    const [ download ] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportBtn.click()
    ]);
    return download;
  }

  async importarConfiguracion(filePath) {
    await this.importFileInput.setInputFiles(filePath);
  }

  async confirmarImportacion() {
    await this.importConfirmBtn.click();
  }

  async cancelarImportacion() {
    await this.importCancelBtn.click();
  }

  async getImportSummary() {
    await this.importSummary.waitFor({ state: 'visible' });
    return await this.importSummaryText.textContent();
  }

  async getStatusMessage() {
    return await this.statusText.textContent();
  }
}
