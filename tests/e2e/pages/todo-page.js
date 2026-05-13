class TodoPage {
  constructor(page) {
    this.page = page;
    this.title = page.getByRole('heading', { name: 'To Do App' });
    this.input = page.getByPlaceholder('Enter item name');
    this.addButton = page.getByRole('button', { name: 'Add Item' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForReady() {
    await this.title.waitFor();
    await this.page.getByRole('heading', { name: 'Items from Database' }).waitFor();
  }

  async addItem(name) {
    await this.input.fill(name);
    await this.addButton.click();
    await this.page.getByText(name).waitFor();
  }

  itemRow(name) {
    return this.page.locator('li', { hasText: name });
  }

  async deleteItem(name) {
    const row = this.itemRow(name);
    await row.getByRole('button', { name: 'Delete' }).click();
  }
}

module.exports = { TodoPage };
