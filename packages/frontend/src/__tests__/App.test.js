import React, { act } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const mockItems = [
  { id: 1, name: 'Task One', details: null, completed: 0, due_date: null, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 2, name: 'Task Two', details: 'Some details', completed: 1, due_date: '2026-01-02', created_at: '2026-01-02T00:00:00.000Z' },
  { id: 3, name: 'Overdue Task', details: null, completed: 0, due_date: '2020-01-01', created_at: '2020-01-01T00:00:00.000Z' },
];

// Mock server to intercept API requests
const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockItems));
  }),

  rest.post('/api/items', (req, res, ctx) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }
    return res(
      ctx.status(201),
      ctx.json({ id: 99, name, details: null, completed: 0, due_date: null, created_at: new Date().toISOString() })
    );
  }),

  rest.put('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    const item = mockItems.find((i) => i.id === Number(id));
    if (!item) return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    return res(ctx.status(200), ctx.json({ ...item, ...req.body }));
  }),

  rest.delete('/api/items/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Item deleted successfully', id: Number(req.params.id) }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the header', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByRole('heading', { name: /to do app/i })).toBeInTheDocument();
  });

  test('loads and displays tasks', async () => {
    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
      expect(screen.getByText('Task Two')).toBeInTheDocument();
    });
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

    await user.type(screen.getByRole('textbox', { name: /new task title/i }), 'Brand New Task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => expect(screen.getByText('Brand New Task')).toBeInTheDocument());
  });

  test('shows overdue indicator for overdue tasks', async () => {
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Overdue Task')).toBeInTheDocument());
    expect(screen.getByLabelText('Overdue')).toBeInTheDocument();
  });

  test('completed tasks have strikethrough styling', async () => {
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task Two')).toBeInTheDocument());
    const taskText = screen.getByText('Task Two');
    expect(taskText).toHaveStyle('text-decoration: line-through');
  });

  test('clicking the checkbox toggles task completion', async () => {
    const user = userEvent.setup();
    server.use(
      rest.put('/api/items/1', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ ...mockItems[0], completed: 1 }));
      })
    );

    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    // Find the checkbox inside the row containing 'Task One'
    const taskOneEl = screen.getByText('Task One');
    const row = taskOneEl.closest('[class*="MuiBox-root"]').parentElement;
    const checkbox = within(row).getAllByRole('checkbox')[0];
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());
  });

  test('deletes a task', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /delete "Task One"/i }));

    await waitFor(() => expect(screen.queryByText('Task One')).not.toBeInTheDocument());
  });

  test('opens edit dialog and saves changes', async () => {
    const user = userEvent.setup();
    server.use(
      rest.put('/api/items/1', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ ...mockItems[0], name: 'Edited Task' }));
      })
    );

    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /edit "Task One"/i }));
    expect(screen.getByRole('dialog', { name: /edit task/i })).toBeInTheDocument();

    const titleInput = within(screen.getByRole('dialog')).getByRole('textbox', { name: /task title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Edited Task');
    await user.click(screen.getByRole('button', { name: /save task/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Edited Task')).toBeInTheDocument();
  });

  test('status filter shows only active tasks', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task Two')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /^active$/i }));

    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
      expect(screen.queryByText('Task Two')).not.toBeInTheDocument();
    });
  });

  test('handles API fetch error gracefully', async () => {
    server.use(rest.get('/api/items', (req, res, ctx) => res(ctx.status(500))));
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText(/failed to fetch tasks/i)).toBeInTheDocument());
  });
});
