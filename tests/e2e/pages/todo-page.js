class TodoPage {
  constructor(page) {
    this.page = page;
    this.title = page.getByRole('heading', { name: 'To Do App' });
    this.titleInput = page.getByLabel('New task title');
    this.addButton = page.getByRole('button', { name: /add task/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForReady() {
    await this.title.waitFor();
    // Wait until the loading spinner disappears
    await this.page.waitForSelector('[role="progressbar"]', { state: 'hidden' });
  }

  async addItem(name) {
    await this.titleInput.fill(name);
    await this.addButton.click();
    await this.page.getByText(name).waitFor();
  }

  itemRow(name) {
    return this.page.locator('[class*="MuiBox"]', { hasText: name }).filter({ has: this.page.getByRole('checkbox') });
  }

  async deleteItem(name) {
    await this.page.getByRole('button', { name: `Delete "${name}"` }).click();
  }

  async editItem(name, newName) {
    await this.page.getByRole('button', { name: `Edit "${name}"` }).click();
    const dialog = this.page.getByRole('dialog', { name: /edit task/i });
    const titleField = dialog.getByLabel('Task title');
    await titleField.clear();
    await titleField.fill(newName);
    await dialog.getByRole('button', { name: /save task/i }).click();
    await this.page.getByText(newName).waitFor();
  }

  async toggleComplete(name) {
    await this.page.getByRole('checkbox', { name: new RegExp(`Mark "${name}"`, 'i') }).click();
  }

  async filterByStatus(status) {
    await this.page.getByRole('button', { name: new RegExp(`^${status}$`, 'i') }).click();
  }

  async sortBy(option) {
    await this.page.getByLabel('Sort by').click();
    await this.page.getByRole('option', { name: option }).click();
  }
}

module.exports = { TodoPage };

