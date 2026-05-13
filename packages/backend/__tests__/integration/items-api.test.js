const request = require('supertest');
const { app, db } = require('../../src/app');

const createdIds = new Set();

const createItem = async (name) => {
  const response = await request(app)
    .post('/api/items')
    .send({ name })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  createdIds.add(response.body.id);
  return response.body;
};

beforeEach(() => {
  createdIds.clear();
});

afterEach(() => {
  const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
  for (const id of createdIds) {
    deleteStmt.run(id);
  }
});

describe('Items API Integration', () => {
  it('creates and then fetches a unique item via real HTTP requests', async () => {
    const uniqueName = `integration-item-${Date.now()}`;
    const createdItem = await createItem(uniqueName);

    const listResponse = await request(app).get('/api/items');
    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);

    const match = listResponse.body.find((item) => item.id === createdItem.id);
    expect(match).toBeDefined();
    expect(match.name).toBe(uniqueName);
  });

  it('creates and deletes an item without depending on other tests', async () => {
    const uniqueName = `delete-item-${Date.now()}`;
    const createdItem = await createItem(uniqueName);

    const deleteResponse = await request(app).delete(`/api/items/${createdItem.id}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      message: 'Item deleted successfully',
      id: createdItem.id,
    });

    // Avoid duplicate cleanup after successful delete.
    createdIds.delete(createdItem.id);

    const listResponse = await request(app).get('/api/items');
    const deleted = listResponse.body.find((item) => item.id === createdItem.id);
    expect(deleted).toBeUndefined();
  });

  it('creates an item with due_date and details, then verifies them', async () => {
    const uniqueName = `dated-item-${Date.now()}`;
    const response = await request(app)
      .post('/api/items')
      .send({ name: uniqueName, due_date: '2026-12-31', details: 'Integration detail' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(201);
    expect(response.body.due_date).toBe('2026-12-31');
    expect(response.body.details).toBe('Integration detail');
    createdIds.add(response.body.id);
  });

  it('updates an item name and marks it complete via PUT', async () => {
    const createdItem = await createItem(`update-item-${Date.now()}`);

    const updateResponse = await request(app)
      .put(`/api/items/${createdItem.id}`)
      .send({ name: 'Updated via integration', completed: true })
      .set('Accept', 'application/json');

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Updated via integration');
    expect(updateResponse.body.completed).toBe(1);
  });

  it('returns 404 when updating a non-existent item', async () => {
    const response = await request(app)
      .put('/api/items/999999999')
      .send({ name: 'Ghost' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item not found');
  });
});
