export class NewTabPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} extensionUrlPrefix
   */
  constructor(page, extensionUrlPrefix) {
    this.page = page;
    this.url = `${extensionUrlPrefix}${extensionUrlPrefix.endsWith('/') ? '' : '/'}newtab/newtab.html`;
    
    // Selectors
    this.searchInput = page.locator('#search');
    this.bookmarksContainer = page.locator('#content');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async search(text) {
    await this.searchInput.fill(text);
  }

  async clearSearch() {
    await this.searchInput.fill('');
  }

  getFolderGroups() {
    return this.page.locator('.group');
  }

  getBookmarks() {
    return this.page.locator('.bookmark');
  }

  getVisibleBookmarkTitles() {
    return this.page.locator('.bookmark .title');
  }
}
