const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/todo-page');

test.describe('todo workflow', () => {
  test('adds and deletes an item through the UI', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const itemName = `e2e-item-${Date.now()}`;

    await todoPage.goto();
    await todoPage.waitForReady();

    await todoPage.addItem(itemName);
    await expect(todoPage.itemRow(itemName)).toBeVisible();

    await todoPage.deleteItem(itemName);
    await expect(todoPage.itemRow(itemName)).toHaveCount(0);
  });
});
