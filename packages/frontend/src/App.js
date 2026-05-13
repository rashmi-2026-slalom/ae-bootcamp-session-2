import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TodayIcon from '@mui/icons-material/Today';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const theme = createTheme({
  palette: {
    primary: { main: '#3F51B5', dark: '#283593' },
    secondary: { main: '#009688' },
    background: { default: '#F5F5F5' },
    error: { main: '#D32F2F' },
    text: { primary: '#212121', secondary: '#757575' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Creation Date' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'completed', label: 'Completion Status' },
];

const STATUS_FILTERS = ['All', 'Active', 'Completed'];
const DATE_FILTERS = ['Any', 'Today', 'This Week', 'Overdue'];

function getItemStatus(item) {
  if (!item.due_date || item.completed) return null;
  const today = dayjs().startOf('day');
  const due = dayjs(item.due_date);
  if (due.isSameOrBefore(today, 'day') && !due.isSame(today, 'day')) return 'overdue';
  if (due.isSame(today, 'day')) return 'today';
  return null;
}

function EditDialog({ open, item, onClose, onSave }) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDetails(item.details || '');
      setDueDate(item.due_date ? dayjs(item.due_date) : null);
    }
  }, [item]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      details: details.trim() || null,
      due_date: dueDate ? dueDate.format('YYYY-MM-DD') : null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Task</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Task title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="outlined"
            required
            fullWidth
            inputProps={{ 'aria-label': 'Task title' }}
          />
          <TextField
            label="Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            variant="outlined"
            multiline
            rows={3}
            fullWidth
            inputProps={{ 'aria-label': 'Task details' }}
          />
          <DatePicker
            label="Due date"
            value={dueDate}
            onChange={setDueDate}
            slotProps={{ textField: { variant: 'outlined', fullWidth: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="primary" aria-label="Cancel edit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!name.trim()}
          aria-label="Save task"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TodoItem({ item, onToggleComplete, onDelete, onEdit }) {
  const status = getItemStatus(item);
  const isCompleted = Boolean(item.completed);

  const textColor = isCompleted
    ? 'text.disabled'
    : status === 'overdue'
    ? 'error.main'
    : status === 'today'
    ? 'warning.main'
    : 'text.primary';

  const textDecoration = isCompleted ? 'line-through' : 'none';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: 1,
      }}
    >
      <Checkbox
        checked={isCompleted}
        onChange={() => onToggleComplete(item)}
        color="primary"
        inputProps={{ 'aria-label': `Mark "${item.name}" as ${isCompleted ? 'incomplete' : 'complete'}` }}
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {status === 'overdue' && (
            <Tooltip title="Overdue">
              <WarningAmberIcon fontSize="small" color="error" aria-label="Overdue" />
            </Tooltip>
          )}
          {status === 'today' && (
            <Tooltip title="Due today">
              <TodayIcon fontSize="small" sx={{ color: 'warning.main' }} aria-label="Due today" />
            </Tooltip>
          )}
          <Typography
            variant="body1"
            sx={{ color: textColor, textDecoration, fontWeight: 500, wordBreak: 'break-word' }}
          >
            {item.name}
          </Typography>
        </Stack>

        {item.details && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {item.details}
          </Typography>
        )}

        {item.due_date && (
          <Typography
            variant="caption"
            sx={{ color: textColor, display: 'block', mt: 0.25 }}
          >
            Due: {dayjs(item.due_date).format('MMM D, YYYY')}
          </Typography>
        )}
      </Box>

      <Tooltip title="Edit">
        <IconButton onClick={() => onEdit(item)} size="small" aria-label={`Edit "${item.name}"`}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          onClick={() => onDelete(item.id)}
          size="small"
          color="error"
          aria-label={`Delete "${item.name}"`}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newDueDate, setNewDueDate] = useState(null);

  // Edit dialog state
  const [editingItem, setEditingItem] = useState(null);

  // Sort & filter state
  const [sortBy, setSortBy] = useState('created_at');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('Any');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      setItems(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          due_date: newDueDate ? newDueDate.format('YYYY-MM-DD') : null,
        }),
      });
      if (!response.ok) throw new Error('Failed to add task');
      const created = await response.json();
      setItems((prev) => [created, ...prev]);
      setNewName('');
      setNewDueDate(null);
      setError(null);
    } catch (err) {
      setError('Error adding task: ' + err.message);
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !item.completed }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      const updated = await response.json();
      setItems((prev) => prev.map((t) => (t.id === item.id ? updated : t)));
    } catch (err) {
      setError('Error updating task: ' + err.message);
    }
  };

  const handleEditSave = async (changes) => {
    try {
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error('Failed to update task');
      const updated = await response.json();
      setItems((prev) => prev.map((t) => (t.id === editingItem.id ? updated : t)));
      setEditingItem(null);
      setError(null);
    } catch (err) {
      setError('Error updating task: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete task');
      setItems((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      setError('Error deleting task: ' + err.message);
    }
  };

  const displayedItems = useMemo(() => {
    const today = dayjs().startOf('day');
    const endOfWeek = today.add(6, 'day');

    let filtered = items.filter((item) => {
      if (statusFilter === 'Active' && item.completed) return false;
      if (statusFilter === 'Completed' && !item.completed) return false;

      if (dateFilter === 'Today') {
        return item.due_date && dayjs(item.due_date).isSame(today, 'day');
      }
      if (dateFilter === 'This Week') {
        return (
          item.due_date &&
          dayjs(item.due_date).isSameOrAfter(today, 'day') &&
          dayjs(item.due_date).isSameOrBefore(endOfWeek, 'day')
        );
      }
      if (dateFilter === 'Overdue') {
        return item.due_date && dayjs(item.due_date).isBefore(today, 'day') && !item.completed;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return dayjs(a.due_date).diff(dayjs(b.due_date));
      }
      if (sortBy === 'completed') {
        return Number(a.completed) - Number(b.completed);
      }
      // default: created_at descending
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [items, sortBy, statusFilter, dateFilter]);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
          <Container maxWidth="md">
            {/* Header */}
            <Box component="header" sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="primary">
                To Do App
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Keep track of your tasks
              </Typography>
            </Box>

            {/* Add Task Form */}
            <Box
              component="section"
              aria-label="Add new task"
              sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1, mb: 3 }}
            >
              <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
                Add New Task
              </Typography>
              <Box component="form" onSubmit={handleAdd}>
                <Stack spacing={2}>
                  <TextField
                    label="New task title"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    variant="outlined"
                    required
                    fullWidth
                    placeholder="What needs to be done?"
                  />
                  <DatePicker
                    label="Due date (optional)"
                    value={newDueDate}
                    onChange={setNewDueDate}
                    slotProps={{ textField: { variant: 'outlined', fullWidth: true } }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<AddIcon />}
                    disabled={!newName.trim()}
                    aria-label="Add task"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Add Task
                  </Button>
                </Stack>
              </Box>
            </Box>

            {/* Error Banner */}
            {error && (
              <Typography color="error" sx={{ mb: 2 }} role="alert">
                {error}
              </Typography>
            )}

            {/* Sort & Filter Controls */}
            <Box
              component="section"
              aria-label="Sort and filter tasks"
              sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1, mb: 3 }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="sort-label">Sort by</InputLabel>
                  <Select
                    labelId="sort-label"
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value)}
                    inputProps={{ 'aria-label': 'Sort tasks by' }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Status:
                  </Typography>
                  <ButtonGroup size="small" aria-label="Filter by status">
                    {STATUS_FILTERS.map((f) => (
                      <Button
                        key={f}
                        variant={statusFilter === f ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => setStatusFilter(f)}
                        aria-pressed={statusFilter === f}
                      >
                        {f}
                      </Button>
                    ))}
                  </ButtonGroup>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Due:
                  </Typography>
                  <ButtonGroup size="small" aria-label="Filter by due date">
                    {DATE_FILTERS.map((f) => (
                      <Button
                        key={f}
                        variant={dateFilter === f ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => setDateFilter(f)}
                        aria-pressed={dateFilter === f}
                      >
                        {f}
                      </Button>
                    ))}
                  </ButtonGroup>
                </Stack>
              </Stack>
            </Box>

            {/* Task List */}
            <Box component="section" aria-label="Task list">
              <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
                Tasks{' '}
                <Typography component="span" variant="caption" color="text.secondary">
                  ({displayedItems.length})
                </Typography>
              </Typography>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress aria-label="Loading tasks" />
                </Box>
              )}

              {!loading && displayedItems.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No tasks found. Add one above!
                </Typography>
              )}

              {!loading && (
                <Stack spacing={1}>
                  {displayedItems.map((item) => (
                    <TodoItem
                      key={item.id}
                      item={item}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDelete}
                      onEdit={setEditingItem}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Container>
        </Box>

        {/* Edit Dialog */}
        <EditDialog
          open={Boolean(editingItem)}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleEditSave}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
