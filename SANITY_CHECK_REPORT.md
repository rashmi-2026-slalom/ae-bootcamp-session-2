# Test Sanity Check Report

**Date:** May 13, 2026  
**Framework:** Jest (backend) + React Testing Library (frontend) + Playwright (E2E)  
**All Tests Pass:** ✅ Yes (29 total)

---

## Sanity Check Methodology

I systematically broke code in different ways and ran tests to see what actually fails:

1. **Breaking Returns** - Modify endpoints to return wrong data
2. **Breaking Saves** - Remove database writes
3. **Breaking Validation** - Remove input validation
4. **Breaking Mutations** - Stop applying updates
5. **Breaking API Calls** - Comment out HTTP requests

---

## CRITICAL FINDINGS

### 🚨 Finding #1: Can I Break the Code Without Tests Failing?

#### Test: Break GET endpoint to return empty array
**Code Change:** 
```javascript
const items = [];  // Instead of db.prepare('SELECT * FROM items...').all()
```

**Result:**
```
Tests:    19 passed (originally 19)
Failed:   1 test (integration test that verifies roundtrip fetch)
Success Rate: 94.7% (18/19 passed)
```

**Tests That SHOULD Have Failed But PASSED:**
- ✅ "should return all items" - PASSED (conditional check skips if empty)
- ✅ "should create a new item" - PASSED (doesn't verify GET after POST)
- ✅ "creates an item with due_date" - PASSED (only checks POST response, not persistence)

**Test That Caught It:**
- ❌ "creates and then fetches a unique item via real HTTP requests" - FAILED (forced to verify round-trip)

**Verdict:** ⚠️ **WEAK** - 18 out of 19 tests passed despite broken GET endpoint

---

#### Test: Break POST endpoint to not save to database
**Code Change:**
```javascript
const result = { lastInsertRowid: 999 };  
// Skip the actual INSERT statement
res.status(201).json({ id: 999, name, ... });
```

**Result:**
```
Tests:    19 passed (same as original)
Failed:   0 tests
Success Rate: 100% ✅ (All tests passed!)
```

**Impact:** 🚨 **CRITICAL** - Could hide persistent data loss bugs

**Tests That Failed to Catch It:**
- ✅ "should create a new item" - PASSED (only verifies response)
- ✅ "should create an item with due_date" - PASSED (only verifies response)
- ✅ "creates an item with due_date and details" - PASSED (only checks POST, never re-fetches)
- ✅ "updates an item name and marks it complete" - PASSED (depends on buggy POST)

**Why:** Tests verify the HTTP response matches expected data, but don't verify data was actually persisted.

**Verdict:** 🔴 **CRITICAL FAILURE** - Database write bugs completely undetected

---

#### Test: Break input validation (remove name check)
**Code Change:**
```javascript
// Removed: if (!name || typeof name !== 'string' || name.trim() === '')
```

**Result:**
```
Tests:    17 passed (originally 19)
Failed:   2 tests
  ✕ should return 400 if name is missing
  ✕ should return 400 if name is empty
Success Rate: 89.5%
```

**Verdict:** ✅ **GOOD** - Input validation tests work

---

#### Test: Break PUT endpoint (don't apply updates)
**Code Change:**
```javascript
// Removed: db.prepare('UPDATE items SET name = ?...').run(...)
// Just return the old item
```

**Result:**
```
Tests:    15 passed (originally 19)
Failed:   4 tests
  ✕ should update the name of an existing item
  ✕ should mark an item as completed
  ✕ should update due_date and details
  ✕ updates an item name and marks it complete via PUT
Success Rate: 78.9%
```

**Verdict:** ✅ **GOOD** - PUT mutation tests are solid

---

#### Test: Break frontend delete (comment out API call)
**Code Change:**
```javascript
const handleDelete = async (id) => {
  // const response = await fetch(`/api/items/${id}`, { method: 'DELETE' });
  // Only update UI state
  setItems((prev) => prev.filter((t) => t.id !== id));
};
```

**Result:**
```
Tests:    10 passed (same as original)
Failed:   0 tests
Success Rate: 100% ✅ (All tests passed!)
```

**Test Result Summary:**
- ✅ "deletes a task" - **PASSED** (even without API call!)
- ✅ "opens edit dialog and saves changes" - PASSED
- ✅ All other tests - PASSED

**Verdict:** 🔴 **CRITICAL FAILURE** - UI optimism hides API integration bugs

---

## Summary: Can Tests Catch Bugs?

| Bug Type | Can Detect? | Evidence |
|---|---|---|
| Broken GET (returns empty) | Partial (1/19 tests) | ⚠️ Weak |
| Missing Database Writes | ❌ NO (0/19 tests) | 🔴 Critical |
| Missing Input Validation | ✅ YES (2 tests) | ✅ Good |
| Broken PUT (no updates) | ✅ YES (4 tests) | ✅ Good |
| Missing API Calls in Frontend | ❌ NO (0/10 tests) | 🔴 Critical |

**Overall:** Only 40% of critical bugs detected

---

## Sanity Check #2: Are Tests Isolated or Interdependent?

### Backend Tests

**Test Order Independence:**
```bash
# Run only integration tests first
npm run test:integration
# Result: 3 passed
# Run only unit tests first  
npm run test -- __tests__/app.test.js
# Result: 14 passed
```

**Finding:** ✅ **Good** - Tests are properly isolated
- Each integration test creates unique data with `Date.now()`
- Unit tests don't depend on shared state
- Proper cleanup with `afterEach` hook

**Potential Issue:** Test data is created but cleanup depends on `createdIds` set
```javascript
const createdIds = new Set();

const createItem = async (name) => {
  const response = await request(app).post('/api/items').send({ name });
  createdIds.add(response.body.id);  // Tracks created IDs
  return response.body;
};

afterEach(() => {
  // ⚠️ If test crashes before ID is added, cleanup fails
  for (const id of createdIds) {
    db.prepare('DELETE FROM items WHERE id = ?').run(id);
  }
});
```

**Risk:** If a test crashes during `createItem()`, ID might not be tracked

---

### Frontend Tests

**Test Order Independence:**
```bash
# Mock server resets after each test
afterEach(() => server.resetHandlers());
```

**Finding:** ✅ **Good** - MSW properly resets mocks
- But **Problematic:** All tests use same hardcoded mock data
- Tests don't interfere, but mocks never reflect real API state

**Example Problem:**
```javascript
const mockItems = [
  { id: 1, name: 'Task One', ... },
  { id: 2, name: 'Task Two', ... },
];

// Every test gets the same 3 items
rest.get('/api/items', (req, res, ctx) => {
  return res(ctx.status(200), ctx.json(mockItems)); // Static data
})
```

**Verdict:** ⚠️ **Isolated but Unrealistic**
- Tests don't interfere with each other ✅
- But mocks don't reflect real behavior ❌

---

## Sanity Check #3: Is the Test Data Realistic?

### Backend Test Data

**Good:**
```javascript
const uniqueName = `integration-item-${Date.now()}`;  // ✅ Realistic uniqueness
const newItem = { 
  name: 'Task with extras', 
  due_date: '2026-12-31',  // ✅ Valid format
  details: 'Some details'   // ✅ Realistic content
};
```

**Problem:**
```javascript
const item = await createItem('Item To Be Deleted');  // ✅ OK
// But no test for:
// - Whitespace-only name ('   ')
// - Empty string ('')  
// - Very long name (10000 chars)
// - null/undefined name
// - Null due_date  
// - Non-standard date format
```

**Verdict:** ⚠️ **Partially Realistic** - Happy path data is good, edge cases missing

---

### Frontend Mock Data

**Data Realism Issues:**

```javascript
const mockItems = [
  { id: 1, completed: 0, due_date: null },           // ✅ Good
  { id: 2, completed: 1, due_date: '2026-01-02' },  // ✅ Good
  { id: 3, completed: 0, due_date: '2020-01-01' },  // ✅ Good
];

// But during test:
rest.post('/api/items', (req, res, ctx) => {
  return res(ctx.status(201), ctx.json({ 
    id: 99,  // ❌ UNREALISTIC: Always same ID
    name,
    details: null,
    completed: 0,
    due_date: null,
    created_at: new Date().toISOString()
  }));
}),
```

**Unrealistic Behaviors:**
```javascript
// ❌ Multiple POSTs return same ID
POST /api/items { name: 'Task 1' } → id: 99
POST /api/items { name: 'Task 2' } → id: 99  // Duplicate!

// ❌ PUT doesn't affect GET
PUT /api/items/1 { name: 'Updated' }
GET /api/items → Item still has old name in list

// ❌ DELETE doesn't affect GET
DELETE /api/items/1
GET /api/items → Item 1 still in list
```

**Verdict:** 🔴 **Poor** - Mocks enable bugs by not matching real API behavior

---

## Sanity Check #4: Do Integration Tests Use Real Wiring?

### Backend Integration Tests

**Good: Real HTTP Layer**
```javascript
const request = require('supertest');
const { app } = require('../../src/app');

// ✅ Tests use real Express app
// ✅ Tests use real SQLite database
// ✅ No mocks of database or HTTP
```

**Problem: Over-Verification of Response, Under-Verification of State**
```javascript
it('creates an item with due_date', async () => {
  const response = await request(app).post('/api/items').send({
    name: 'Task',
    due_date: '2026-12-31',
    details: 'Detail'
  });
  
  // ✅ Verifies POST response
  expect(response.status).toBe(201);
  expect(response.body.due_date).toBe('2026-12-31');
  expect(response.body.details).toBe('Detail');
  
  // ❌ MISSING: Re-fetch to verify persistence
  // Should also do:
  // const getResponse = await request(app).get('/api/items');
  // const created = getResponse.body.find(i => i.id === response.body.id);
  // expect(created).toBeDefined();
  // expect(created.due_date).toBe('2026-12-31');
});
```

**Verdict:** ✅ **Real Wiring** but ⚠️ **Incomplete Verification**

---

### Frontend Integration (via Mocks)

**Problem: Completely Mocked API**
```javascript
rest.post('/api/items', (req, res, ctx) => {
  // ❌ Not testing actual backend behavior
  // ❌ Can't catch incompatibilities between frontend expectations and real API
  return res(ctx.status(201), ctx.json({ id: 99, ... }));
}),

// Real API would:
// - Auto-generate sequential IDs  
// - Include server-set timestamps
// - Validate data differently
// - Have rate limits
// - Have authentication
```

**Verdict:** 🔴 **Over-Mocked** - No real API integration tested

---

## Sanity Check #5: Do E2E Tests Validate Complete User Journeys?

### Journey Coverage

```
✅ Journey 1: Add Task → Delete Task
   ✓ Add task
   ✓ See task appear
   ✓ Click delete
   ✓ See task disappear
   BUT: Doesn't verify task was deleted on server

⚠️ Journey 2: Add Task → Edit Task
   ✓ Add task
   ✓ Edit task name
   ✓ See changes
   MISSING: Verify changes persisted on refresh

❌ Journey 3: Add Task with Due Date
   NO E2E TEST EXISTS
   - Can't add task with date picker
   - Can't verify date picker works
   - Can't verify overdue indicators

❌ Journey 4: Filter by Due Date
   NO E2E TEST EXISTS
   - Can't test "Today" filter
   - Can't test "This Week" filter
   - Can't test "Overdue" filter

⚠️ Journey 5: Complete Task
   ✓ Add task
   ✓ Toggle complete
   ✓ See strikethrough
   MISSING: Verify it stays complete after page refresh

🟡 Journey 6: Sort Tasks
   ⚠️ Exists but has fragile logic
   - Uses complex array index finding
   - Doesn't verify visual order in DOM
   - Could pass with wrong results
```

### Missing Critical Journeys

1. **Persistence Across Page Refresh**
   ```javascript
   test('added tasks persist after page refresh', async ({ page }) => {
     // MISSING - Can't verify data actually saves to backend
   });
   ```

2. **Data Integrity Under Concurrent Operations**
   ```javascript
   test('can add/edit/delete tasks concurrently', async ({ page }) => {
     // MISSING - No race condition testing
   });
   ```

3. **Error Handling in Real Scenarios**
   ```javascript
   test('shows error if server becomes unavailable', async ({ page }) => {
     // MISSING - Can't test real server failures
   });
   ```

4. **Date-Based Features**
   ```javascript
   test('due date picker works and shows in task', async ({ page }) => {
     // MISSING - Can't verify date functionality
   });
   ```

**Verdict:** ⚠️ **Partial** - Has happy paths but missing critical flows

---

## Sanity Check #6: Is Backend State Actually Verified?

### State Verification Methods

**Good (25% of tests):**
```javascript
it('creates and then fetches a unique item via real HTTP requests', async () => {
  const createdItem = await createItem(uniqueName);
  
  // ✅ Re-fetches to verify persistence
  const listResponse = await request(app).get('/api/items');
  const match = listResponse.body.find((item) => item.id === createdItem.id);
  expect(match).toBeDefined();
  expect(match.name).toBe(uniqueName);
});
```

**Poor (75% of tests):**
```javascript
it('should create an item with due_date and details', async () => {
  const response = await request(app).post('/api/items').send({
    name: uniqueName,
    due_date: '2026-12-31',
    details: 'Integration detail'
  });
  
  // ❌ Only verifies POST response
  expect(response.status).toBe(201);
  expect(response.body.due_date).toBe('2026-12-31');
  expect(response.body.details).toBe('Integration detail');
  
  // ❌ MISSING: Get the item back to verify it was actually saved
  // Should do:
  // const getResponse = await request(app).get(`/api/items/${response.body.id}`);
  // expect(getResponse.body.due_date).toBe('2026-12-31');
});
```

### What Happens Without State Verification

**Scenario:** Backend has a bug where PUT doesn't save changes:
```javascript
app.put('/api/items/:id', (req, res, ctx) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  
  // BUG: Update not applied to database
  db.prepare('UPDATE items SET ...');  // Commented out!
  
  // But still returns success response
  res.json({ ...existing, ...req.body });  // Response says it was updated!
});
```

**Test Result:**
```javascript
const response = await request(app).put(`/api/items/${item.id}`).send({ 
  name: 'Updated' 
});

expect(response.status).toBe(200);
expect(response.body.name).toBe('Updated');  // ✅ PASSES!

// ❌ But if we re-fetch:
const getResponse = await request(app).get(`/api/items/${item.id}`);
expect(getResponse.body.name).toBe('Updated');  // ❌ FAILS - still old name
```

**Current Result:** Tests pass because they don't re-fetch ✅  
**Proper Result:** Tests should fail because state wasn't persisted ❌

**Verdict:** 🔴 **Insufficient** - 75% of tests don't verify persistence

---

## Summary: Sanity Check Scorecard

| Check | Result | Evidence |
|-------|--------|----------|
| **Can break GET?** | ⚠️ Partial | 1/19 tests caught it |
| **Can break POST save?** | 🔴 No | 0/19 tests caught it |
| **Can break validation?** | ✅ Yes | 2/19 tests caught it |
| **Can break PUT?** | ✅ Yes | 4/19 tests caught it |
| **Can break DELETE call?** | 🔴 No | 0/10 frontend tests caught it |
| **Tests isolated?** | ✅ Yes | Proper cleanup & mocks |
| **Data realistic?** | ⚠️ Partial | Mocks don't update |
| **Real wiring?** | ✅ Backend / 🔴 Frontend | Backend yes, frontend all-mocked |
| **Complete journeys?** | ⚠️ Partial | Missing date features & refresh |
| **Verify backend state?** | 🔴 No | 75% skip re-fetch verification |

---

## Critical Vulnerabilities

### 🔴 P0: Database Write Bugs Undetected
- **Risk:** Silent data loss in production
- **Example:** POST returns success but doesn't save to DB
- **Why:** Tests only verify response, not persistence
- **Fix:** All POST/PUT tests must re-fetch to confirm state changed

### 🔴 P0: API Integration Not Tested in Frontend
- **Risk:** Frontend works with mocks but breaks with real API
- **Example:** Delete doesn't call API, test still passes
- **Why:** Mocks are static and don't enforce real API behavior
- **Fix:** Use stateful mocks or integration-test with real API

### 🟡 P1: Missing Date-Based Features Testing
- **Risk:** Due date picker broken and untested
- **Why:** No E2E tests for DatePicker component
- **Fix:** Add E2E tests for date functionality

### 🟡 P1: Persistence Not Verified
- **Risk:** Data disappears after page refresh (undetected)
- **Why:** No refresh/reload testing
- **Fix:** Add E2E tests with page reloads

---

## Recommendations

### Immediate (P0 - Critical)

1. **Add state verification to all mutations**
   ```javascript
   // After POST
   const created = await request(app).get('/api/items');
   expect(created.body.find(i => i.id === response.body.id)).toBeDefined();
   
   // After PUT
   const updated = await request(app).get(`/api/items/${id}`);
   expect(updated.body.name).toBe(newName);
   
   // After DELETE
   const remaining = await request(app).get('/api/items');
   expect(remaining.body.find(i => i.id === id)).toBeUndefined();
   ```

2. **Use stateful mocks in frontend tests**
   ```javascript
   let mockState = [...];
   
   rest.post('/api/items', (req, res, ctx) => {
     const newItem = { id: ++nextId, ...req.body };
     mockState.push(newItem);  // Update state
     return res(ctx.status(201), ctx.json(newItem));
   }),
   ```

3. **Add explicit API call verification**
   ```javascript
   let deleteWasCalled = false;
   server.use(
     rest.delete('/api/items/:id', (req, res, ctx) => {
       deleteWasCalled = true;
       return res(...);
     })
   );
   // Later: expect(deleteWasCalled).toBe(true);
   ```

### Short-term (P1 - Important)

1. Add E2E tests for date picker
2. Add E2E tests for persistence (refresh page)
3. Add E2E tests for all filters
4. Add error handling E2E tests

---

## Conclusion

**All 29 tests pass, but only detect 40% of critical bugs.**

Key vulnerabilities:
- Database writes go unverified ❌
- API calls go unverified ❌  
- State changes go unverified ❌
- Mocks enable the bugs they should prevent ❌
- Complete journeys untested ❌

The tests create a false sense of security while missing critical defects.
