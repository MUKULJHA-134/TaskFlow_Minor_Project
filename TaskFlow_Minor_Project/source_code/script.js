/* ================================================
   TaskFlow – script.js
   Task Management Web Application
   ================================================ */

'use strict';

/* ============================================================
   CONSTANTS & STATE
   ============================================================ */
const STORAGE_KEY = 'taskflow_tasks_v1';
const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };

/** Global application state */
const AppState = {
  tasks: [],              // Array of task objects
  currentView: 'dashboard',
  taskToDelete: null,     // ID of task queued for deletion
  editingTaskId: null,    // ID of task being edited
  filters: {
    status: 'all',
    priority: 'all',
    sort: 'createdDate-desc',
    search: '',
  },
};

/* ============================================================
   TASK SCHEMA
   {
     id:          string  (UUID)
     title:       string
     description: string
     priority:    'high' | 'medium' | 'low'
     status:      'pending' | 'completed'
     dueDate:     string  (YYYY-MM-DD)
     createdAt:   string  (ISO date string)
     updatedAt:   string  (ISO date string)
   }
   ============================================================ */

/* ============================================================
   UTILITIES
   ============================================================ */

/** Generate a simple unique ID */
function generateId() {
  return `tf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Format a date string to readable form */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Return today's date string YYYY-MM-DD */
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/** Check if a task is overdue */
function isOverdue(task) {
  if (task.status === 'completed') return false;
  return task.dueDate && task.dueDate < todayStr();
}

/** Check if a task is due today */
function isDueToday(task) {
  return task.dueDate === todayStr() && task.status !== 'completed';
}

/** Escape HTML to prevent XSS */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/** Debounce helper */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ============================================================
   LOCAL STORAGE
   ============================================================ */

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState.tasks));
  } catch (e) {
    showToast('Could not save to Local Storage.', 'error');
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    AppState.tasks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    AppState.tasks = [];
  }
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
const TOAST_ICONS = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>`,
  error:   `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
  info:    `<svg viewBox="0 0 24 24" fill="none" stroke="#6c63ff" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`,
};

function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `${TOAST_ICONS[type] || ''}${escapeHtml(message)}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ============================================================
   FORM VALIDATION
   ============================================================ */
function validateTaskForm() {
  let valid = true;
  clearFormErrors();

  const title    = document.getElementById('taskTitle').value.trim();
  const priority = document.getElementById('taskPriority').value;
  const dueDate  = document.getElementById('taskDueDate').value;

  if (!title) {
    setFieldError('taskTitle', 'titleError', 'Task title is required.');
    valid = false;
  } else if (title.length < 2) {
    setFieldError('taskTitle', 'titleError', 'Title must be at least 2 characters.');
    valid = false;
  }

  if (!priority) {
    setFieldError('taskPriority', 'priorityError', 'Please select a priority level.');
    valid = false;
  }

  if (!dueDate) {
    setFieldError('taskDueDate', 'dueDateError', 'Due date is required.');
    valid = false;
  }

  return valid;
}

function setFieldError(inputId, errorId, msg) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (err)   err.textContent = msg;
}

function clearFormErrors() {
  ['taskTitle', 'taskPriority', 'taskDueDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('error');
  });
  ['titleError', 'priorityError', 'dueDateError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

/* ============================================================
   TASK CRUD OPERATIONS
   ============================================================ */

/** Add or update a task */
function saveTask(e) {
  e.preventDefault();
  if (!validateTaskForm()) return;

  const title       = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDesc').value.trim();
  const priority    = document.getElementById('taskPriority').value;
  const dueDate     = document.getElementById('taskDueDate').value;
  const statusBtn   = document.querySelector('.status-btn.active');
  const editId      = document.getElementById('taskId').value;

  const now = new Date().toISOString();

  if (editId) {
    // Update existing task
    const idx = AppState.tasks.findIndex(t => t.id === editId);
    if (idx !== -1) {
      const currentStatus = statusBtn ? statusBtn.dataset.status : (AppState.tasks[idx].status || 'pending');
      AppState.tasks[idx] = {
        ...AppState.tasks[idx],
        title, description, priority, dueDate,
        status: currentStatus,
        updatedAt: now,
      };
      showToast('Task updated successfully!', 'success');
    }
  } else {
    // Create new task
    const status = statusBtn ? statusBtn.dataset.status : 'pending';
    const newTask = {
      id: generateId(),
      title, description, priority, dueDate, status,
      createdAt: now,
      updatedAt: now,
    };
    AppState.tasks.unshift(newTask);
    showToast('Task created successfully!', 'success');
  }

  saveTasks();
  closeTaskModal();
  refreshAllViews();
}

/** Toggle completion status */
function toggleTaskStatus(id) {
  const task = AppState.tasks.find(t => t.id === id);
  if (!task) return;
  task.status = task.status === 'completed' ? 'pending' : 'completed';
  task.updatedAt = new Date().toISOString();
  saveTasks();
  refreshAllViews();
  showToast(
    task.status === 'completed' ? '✅ Task marked as completed!' : 'Task marked as pending.',
    task.status === 'completed' ? 'success' : 'info'
  );
}

/** Open delete confirmation */
function requestDeleteTask(id) {
  const task = AppState.tasks.find(t => t.id === id);
  if (!task) return;
  AppState.taskToDelete = id;
  document.getElementById('deleteTaskName').textContent = `"${task.title}"`;
  openDeleteModal();
}

/** Permanently delete a task */
function confirmDeleteTask() {
  if (!AppState.taskToDelete) return;
  const task = AppState.tasks.find(t => t.id === AppState.taskToDelete);
  AppState.tasks = AppState.tasks.filter(t => t.id !== AppState.taskToDelete);
  AppState.taskToDelete = null;
  saveTasks();
  closeDeleteModal();
  refreshAllViews();
  showToast(`Task "${task?.title || ''}" deleted.`, 'info');
}

/* ============================================================
   FILTERING & SORTING
   ============================================================ */

/** Apply current filters + sort to task array */
function getFilteredTasks(tasks, overrideFilters = {}) {
  const f = { ...AppState.filters, ...overrideFilters };

  let result = tasks.filter(task => {
    // Status filter
    if (f.status === 'pending'   && task.status !== 'pending')   return false;
    if (f.status === 'completed' && task.status !== 'completed') return false;
    if (f.status === 'overdue'   && !isOverdue(task))            return false;

    // Priority filter
    if (f.priority !== 'all' && task.priority !== f.priority) return false;

    // Search
    if (f.search) {
      const q = f.search.toLowerCase();
      const inTitle = task.title.toLowerCase().includes(q);
      const inDesc  = (task.description || '').toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }

    return true;
  });

  // Sorting
  const [field, dir] = f.sort.split('-');
  result.sort((a, b) => {
    let av, bv;
    if (field === 'priority') {
      av = PRIORITY_ORDER[a.priority] || 0;
      bv = PRIORITY_ORDER[b.priority] || 0;
    } else if (field === 'title') {
      av = a.title.toLowerCase();
      bv = b.title.toLowerCase();
    } else if (field === 'createdDate') {
      av = a.createdAt;
      bv = b.createdAt;
    } else if (field === 'dueDate') {
      av = a.dueDate || '';
      bv = b.dueDate || '';
    }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });

  return result;
}

/* ============================================================
   TASK CARD RENDERER
   ============================================================ */

function getStatusClass(task) {
  if (isOverdue(task)) return 'overdue';
  return task.status;
}

function getStatusLabel(task) {
  if (isOverdue(task)) return 'Overdue';
  return task.status === 'completed' ? 'Completed' : 'Pending';
}

function getDueDateClass(task) {
  if (isOverdue(task))   return 'overdue-date';
  if (isDueToday(task))  return 'today-date';
  return '';
}

function buildTaskCard(task) {
  const statusClass  = getStatusClass(task);
  const statusLabel  = getStatusLabel(task);
  const dueDateCls   = getDueDateClass(task);
  const isCompleted  = task.status === 'completed';
  const shortDesc    = task.description ? escapeHtml(task.description.slice(0, 80)) + (task.description.length > 80 ? '…' : '') : '';

  return `
  <article class="task-card priority-${task.priority}${isCompleted ? ' completed-card' : ''}" data-id="${task.id}" role="listitem">
    <div class="task-checkbox-wrap">
      <input
        type="checkbox"
        class="task-checkbox"
        id="chk-${task.id}"
        ${isCompleted ? 'checked' : ''}
        onchange="toggleTaskStatus('${task.id}')"
        aria-label="Mark task ${isCompleted ? 'pending' : 'complete'}"
      />
    </div>
    <div class="task-info">
      <div class="task-title">${escapeHtml(task.title)}</div>
      ${shortDesc ? `<div class="task-desc">${shortDesc}</div>` : ''}
      <div class="task-meta">
        <span class="badge-priority badge-${task.priority}">${task.priority}</span>
        <span class="badge-status badge-${statusClass}">${statusLabel}</span>
        ${task.dueDate ? `
        <span class="task-due ${dueDateCls}" title="Due date">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          ${formatDate(task.dueDate)}
        </span>` : ''}
        <span class="task-created">Created ${formatDate(task.createdAt.split('T')[0])}</span>
      </div>
    </div>
    <div class="task-actions" role="group" aria-label="Task actions">
      <button class="task-action-btn edit-btn" onclick="openEditTask('${task.id}')" aria-label="Edit task" title="Edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
      </button>
      <button class="task-action-btn delete-btn" onclick="requestDeleteTask('${task.id}')" aria-label="Delete task" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
      </button>
    </div>
  </article>`;
}

/** Render a list of tasks into a container */
function renderTaskList(containerId, emptyStateId, tasks, emptyMsg = '') {
  const container  = document.getElementById(containerId);
  const emptyState = document.getElementById(emptyStateId);
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = '';
    if (emptyState) {
      emptyState.classList.remove('hidden');
      const msgEl = emptyState.querySelector('p');
      if (msgEl && emptyMsg) msgEl.textContent = emptyMsg;
    }
  } else {
    container.setAttribute('role', 'list');
    container.innerHTML = tasks.map(buildTaskCard).join('');
    if (emptyState) emptyState.classList.add('hidden');
  }
}

/* ============================================================
   DASHBOARD STATS
   ============================================================ */

function updateDashboard() {
  const all       = AppState.tasks;
  const total     = all.length;
  const completed = all.filter(t => t.status === 'completed').length;
  const pending   = all.filter(t => t.status === 'pending').length;
  const overdue   = all.filter(t => isOverdue(t)).length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Update stat numbers with animation
  animateNumber('statTotal',     total);
  animateNumber('statPending',   pending);
  animateNumber('statCompleted', completed);
  animateNumber('statOverdue',   overdue);

  // Progress bar
  document.getElementById('progressPct').textContent = `${pct}%`;
  const fill  = document.getElementById('progressBarFill');
  const track = document.getElementById('progressBarTrack');
  fill.style.width = `${pct}%`;
  track.setAttribute('aria-valuenow', pct);

  // Sidebar badges
  const pendingBadge = document.getElementById('pendingBadge');
  const overdueBadge = document.getElementById('overdueBadge');
  pendingBadge.textContent = pending > 0 ? pending : '';
  overdueBadge.textContent = overdue > 0 ? overdue : '';

  // Recent tasks (latest 5)
  const recent = [...all]
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, 5);

  renderTaskList('recentTaskList', 'dashEmptyState', recent);
}

/** Animate counting number */
function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const range = target - start;
  const steps = 20;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(start + (range * step / steps));
    if (step >= steps) { el.textContent = target; clearInterval(timer); }
  }, 16);
}

/* ============================================================
   VIEWS RENDER
   ============================================================ */

function renderAllTasksView() {
  const filtered = getFilteredTasks(AppState.tasks);
  const summary  = document.getElementById('resultsSummary');
  const total    = AppState.tasks.length;

  if (summary) {
    const applied = AppState.filters.status !== 'all' || AppState.filters.priority !== 'all' || AppState.filters.search;
    summary.textContent = applied
      ? `Showing ${filtered.length} of ${total} task${total !== 1 ? 's' : ''}`
      : `Showing all ${total} task${total !== 1 ? 's' : ''}`;
  }

  renderTaskList('allTaskList', 'allEmptyState', filtered,
    AppState.filters.search ? `No tasks match "${AppState.filters.search}".` : 'No tasks match the selected filters.');
}

function renderTodayView() {
  const todays = AppState.tasks.filter(t => isDueToday(t));
  renderTaskList('todayTaskList', 'todayEmptyState', todays);
}

function renderOverdueView() {
  const overdueTasks = AppState.tasks.filter(t => isOverdue(t));
  renderTaskList('overdueTaskList', 'overdueEmptyState', overdueTasks);
}

function renderCompletedView() {
  const done = AppState.tasks.filter(t => t.status === 'completed')
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
  renderTaskList('completedTaskList', 'completedEmptyState', done);
}

function refreshAllViews() {
  updateDashboard();
  renderAllTasksView();
  renderTodayView();
  renderOverdueView();
  renderCompletedView();
}

/* ============================================================
   VIEW NAVIGATION
   ============================================================ */
const VIEW_META = {
  dashboard: { title: 'Dashboard',   subtitle: "Welcome back! Here's your task overview." },
  tasks:     { title: 'All Tasks',   subtitle: 'Manage and track all your tasks.' },
  today:     { title: 'Due Today',   subtitle: "Tasks due today that need your attention." },
  overdue:   { title: 'Overdue',     subtitle: 'Tasks past their due date.' },
  completed: { title: 'Completed',   subtitle: 'Tasks you have finished.' },
};

function switchView(viewName) {
  AppState.currentView = viewName;

  // Update sections
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
    item.setAttribute('aria-current', item.dataset.view === viewName ? 'page' : 'false');
  });

  // Update page title
  const meta = VIEW_META[viewName] || {};
  document.getElementById('pageTitle').textContent    = meta.title    || '';
  document.getElementById('pageSubtitle').textContent = meta.subtitle || '';

  // Refresh the specific view
  refreshAllViews();

  // Close sidebar on mobile
  closeMobileSidebar();
}

/* ============================================================
   TASK MODAL
   ============================================================ */

function openAddTaskModal() {
  AppState.editingTaskId = null;
  document.getElementById('taskId').value = '';
  document.getElementById('taskForm').reset();
  document.getElementById('titleCount').textContent = '0/120';
  document.getElementById('descCount').textContent  = '0/500';
  clearFormErrors();

  // Reset status buttons
  setStatusButton('pending');

  // Set default due date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('taskDueDate').value = tomorrow.toISOString().split('T')[0];

  document.getElementById('modalTitle').textContent = 'New Task';
  document.getElementById('saveTaskBtn').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
    Save Task`;

  openModal('taskModalBackdrop');
  setTimeout(() => document.getElementById('taskTitle').focus(), 100);
}

function openEditTask(id) {
  const task = AppState.tasks.find(t => t.id === id);
  if (!task) return;

  AppState.editingTaskId = id;
  clearFormErrors();

  document.getElementById('taskId').value        = task.id;
  document.getElementById('taskTitle').value     = task.title;
  document.getElementById('taskDesc').value      = task.description || '';
  document.getElementById('taskPriority').value  = task.priority;
  document.getElementById('taskDueDate').value   = task.dueDate || '';

  document.getElementById('titleCount').textContent = `${task.title.length}/120`;
  document.getElementById('descCount').textContent  = `${(task.description || '').length}/500`;

  setStatusButton(task.status);

  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('saveTaskBtn').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
    Update Task`;

  openModal('taskModalBackdrop');
  setTimeout(() => document.getElementById('taskTitle').focus(), 100);
}

function setStatusButton(status) {
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
}

function closeTaskModal() {
  closeModal('taskModalBackdrop');
  clearFormErrors();
}

/* ============================================================
   DELETE MODAL
   ============================================================ */
function openDeleteModal()  { openModal('deleteModalBackdrop');  }
function closeDeleteModal() { closeModal('deleteModalBackdrop'); AppState.taskToDelete = null; }

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
}

/* ============================================================
   MOBILE SIDEBAR
   ============================================================ */
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================================
   THEME
   ============================================================ */
function initTheme() {
  const isDark = localStorage.getItem('taskflow_theme') !== 'light';
  document.body.classList.toggle('light-theme', !isDark);
  document.getElementById('themeToggle').checked = isDark;
}

function toggleTheme(isDark) {
  document.body.classList.toggle('light-theme', !isDark);
  localStorage.setItem('taskflow_theme', isDark ? 'dark' : 'light');
}

/* ============================================================
   KEYBOARD SHORTCUTS
   ============================================================ */
function handleKeyboard(e) {
  // Escape closes modals
  if (e.key === 'Escape') {
    closeTaskModal();
    closeDeleteModal();
    closeMobileSidebar();
  }
  // Ctrl+N opens new task
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    openAddTaskModal();
  }
  // Ctrl+F focuses search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    document.getElementById('globalSearch').focus();
  }
}

/* ============================================================
   SAMPLE DATA (first-run seeding)
   ============================================================ */
function seedSampleData() {
  if (AppState.tasks.length > 0) return;

  const today = todayStr();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow  = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek  = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek  = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);

  const fmt = d => d.toISOString().split('T')[0];

  const samples = [
    {
      title: 'Design UI wireframes',
      description: 'Create wireframes for the new dashboard layout and component library.',
      priority: 'high',
      status: 'completed',
      dueDate: fmt(yesterday),
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      title: 'Write project report',
      description: 'Document the project objectives, technical stack, and implementation details.',
      priority: 'high',
      status: 'pending',
      dueDate: today,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      title: 'Review pull requests',
      description: 'Review and approve pending team pull requests on the main repository.',
      priority: 'medium',
      status: 'pending',
      dueDate: fmt(tomorrow),
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      title: 'Update README.md',
      description: 'Add setup instructions, screenshots, and deployment guide to README.',
      priority: 'low',
      status: 'pending',
      dueDate: fmt(nextWeek),
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      title: 'Fix login bug',
      description: 'Investigate and resolve the authentication token expiry issue on mobile.',
      priority: 'high',
      status: 'pending',
      dueDate: fmt(lastWeek),
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      title: 'Deploy to production',
      description: 'Push the latest build to the production server and verify deployment.',
      priority: 'medium',
      status: 'completed',
      dueDate: fmt(yesterday),
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment.',
      priority: 'medium',
      status: 'pending',
      dueDate: fmt(nextWeek),
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  AppState.tasks = samples.map(s => ({
    ...s,
    id: generateId(),
    updatedAt: s.createdAt,
  }));

  saveTasks();
}

/* ============================================================
   EVENT LISTENERS SETUP
   ============================================================ */

function setupEventListeners() {

  // ---- Navigation ----
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  // View All button on dashboard
  document.getElementById('viewAllBtn')?.addEventListener('click', () => switchView('tasks'));
  document.getElementById('dashAddBtn')?.addEventListener('click', openAddTaskModal);

  // ---- Task Modal ----
  document.getElementById('openAddModal')?.addEventListener('click', openAddTaskModal);
  document.getElementById('fabBtn')?.addEventListener('click', openAddTaskModal);
  document.getElementById('closeModal')?.addEventListener('click', closeTaskModal);
  document.getElementById('cancelModal')?.addEventListener('click', closeTaskModal);
  document.getElementById('taskForm')?.addEventListener('submit', saveTask);

  // Status toggle buttons
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => setStatusButton(btn.dataset.status));
  });

  // Character counters
  document.getElementById('taskTitle')?.addEventListener('input', function () {
    document.getElementById('titleCount').textContent = `${this.value.length}/120`;
    if (this.value.trim()) { this.classList.remove('error'); document.getElementById('titleError').textContent = ''; }
  });
  document.getElementById('taskDesc')?.addEventListener('input', function () {
    document.getElementById('descCount').textContent = `${this.value.length}/500`;
  });

  // Click outside modal to close
  document.getElementById('taskModalBackdrop')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTaskModal();
  });

  // ---- Delete Modal ----
  document.getElementById('closeDeleteModal')?.addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDelete')?.addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDelete')?.addEventListener('click', confirmDeleteTask);
  document.getElementById('deleteModalBackdrop')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDeleteModal();
  });

  // ---- Filters & Search ----
  document.getElementById('filterStatus')?.addEventListener('change', function () {
    AppState.filters.status = this.value;
    renderAllTasksView();
  });
  document.getElementById('filterPriority')?.addEventListener('change', function () {
    AppState.filters.priority = this.value;
    renderAllTasksView();
  });
  document.getElementById('sortBy')?.addEventListener('change', function () {
    AppState.filters.sort = this.value;
    renderAllTasksView();
  });
  document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
    AppState.filters = { status: 'all', priority: 'all', sort: 'createdDate-desc', search: '' };
    document.getElementById('filterStatus').value   = 'all';
    document.getElementById('filterPriority').value = 'all';
    document.getElementById('sortBy').value         = 'createdDate-desc';
    document.getElementById('globalSearch').value   = '';
    renderAllTasksView();
    showToast('Filters cleared.', 'info');
  });

  // Global Search
  const debouncedSearch = debounce(val => {
    AppState.filters.search = val;
    if (AppState.currentView !== 'tasks') switchView('tasks');
    else renderAllTasksView();
  }, 300);

  document.getElementById('globalSearch')?.addEventListener('input', function () {
    debouncedSearch(this.value.trim());
  });

  // ---- Mobile Menu ----
  document.getElementById('mobileMenuBtn')?.addEventListener('click', openMobileSidebar);
  document.getElementById('sidebarOverlay')?.addEventListener('click', closeMobileSidebar);
  document.getElementById('sidebarToggle')?.addEventListener('click', closeMobileSidebar);

  // ---- Theme ----
  document.getElementById('themeToggle')?.addEventListener('change', function () {
    toggleTheme(this.checked);
  });

  // ---- Keyboard ----
  document.addEventListener('keydown', handleKeyboard);
}

/* ============================================================
   BOOTSTRAP / INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Load persisted data
  loadTasks();

  // Seed sample data if first run
  seedSampleData();

  // Initialize theme
  initTheme();

  // Set up all event listeners
  setupEventListeners();

  // Render initial view
  switchView('dashboard');

  console.log('%cTaskFlow Loaded ✅', 'color:#6c63ff;font-weight:bold;font-size:16px;');
  console.log('%cPress Ctrl+N to add a task, Ctrl+F to search.', 'color:#9ca3c4;');
});
