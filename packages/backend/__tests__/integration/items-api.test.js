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
});
