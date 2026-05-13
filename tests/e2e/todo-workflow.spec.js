const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/todo-page');

test.describe('todo workflow', () => {
  test('adds and deletes a task through the UI', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const itemName = `e2e-item-${Date.now()}`;

    await todoPage.goto();
    await todoPage.waitForReady();

    await todoPage.addItem(itemName);
    await expect(page.getByText(itemName)).toBeVisible();

    await todoPage.deleteItem(itemName);
    await expect(page.getByText(itemName)).toHaveCount(0);
  });

  test('edits a task title', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const original = `edit-original-${Date.now()}`;
    const updated = `edit-updated-${Date.now()}`;

    await todoPage.goto();
    await todoPage.waitForReady();

    await todoPage.addItem(original);
    await todoPage.editItem(original, updated);

    await expect(page.getByText(updated)).toBeVisible();
    await expect(page.getByText(original)).toHaveCount(0);
  });

  test('marks a task as complete', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const itemName = `complete-item-${Date.now()}`;

    await todoPage.goto();
    await todoPage.waitForReady();

    await todoPage.addItem(itemName);
    await todoPage.toggleComplete(itemName);

    // Verify the checkbox is now checked
    const checkbox = page.getByRole('checkbox', { name: new RegExp(`Mark "${itemName}"`, 'i') });
    await expect(checkbox).toBeChecked();
  });

  test('filters tasks by Active status', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const activeItem = `active-${Date.now()}`;
    const completedItem = `completed-${Date.now()}`;

    await todoPage.goto();
    await todoPage.waitForReady();

    await todoPage.addItem(activeItem);
    await todoPage.addItem(completedItem);
    await todoPage.toggleComplete(completedItem);

    await todoPage.filterByStatus('Active');

    await expect(page.getByText(activeItem)).toBeVisible();
    await expect(page.getByText(completedItem)).toHaveCount(0);
  });

  test('filters tasks by Completed status', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const activeItem = `active2-${Date.now()}`;
    const completedItem = `completed2-${Date.now()}`;

    await todoPage.goto();
    await todoPage.waitForReady();

    await todoPage.addItem(activeItem);
    await todoPage.addItem(completedItem);
    await todoPage.toggleComplete(completedItem);

    await todoPage.filterByStatus('Completed');

    await expect(page.getByText(completedItem)).toBeVisible();
    await expect(page.getByText(activeItem)).toHaveCount(0);
  });

  test('sorts tasks by completion status', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const itemA = `sort-a-${Date.now()}`;
    const itemB = `sort-b-${Date.now()}`;

    await todoPage.goto();
    await todoPage.waitForReady();

    await todoPage.addItem(itemA);
    await todoPage.addItem(itemB);
    await todoPage.toggleComplete(itemB);

    await todoPage.sortBy('Completion Status');

    // After sorting, active tasks should appear before completed
    const taskNames = await page.locator('[aria-label^="Mark"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('aria-label'))
    );
    const aIndex = taskNames.findIndex((l) => l && l.includes(itemA));
    const bIndex = taskNames.findIndex((l) => l && l.includes(itemB));
    expect(aIndex).toBeLessThan(bIndex);
  });

  test('shows header and add-task section', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.waitForReady();

    await expect(page.getByRole('heading', { name: /to do app/i })).toBeVisible();
    await expect(page.getByLabel('New task title')).toBeVisible();
    await expect(page.getByRole('button', { name: /add task/i })).toBeVisible();
  });
});
