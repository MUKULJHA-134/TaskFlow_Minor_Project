/**
 * TaskFlow – Task Management Web Application
 * Core Client-side Logic (HTML5, CSS3, JavaScript ES6+)
 * 
 * Features:
 * - Full CRUD Operations (Create, Read, Update, Delete)
 * - Browser Local Storage persistence
 * - Real-time Filtering (Status, Priority) & Multi-criteria Sorting
 * - Live Search (Title, Description, Category)
 * - Real-time Dashboard Metrics & Overdue detection
 * - Field Validation with Inline Error Alerts
 * - Theme Switcher (Dark / Light Mode)
 * - Grid & List View Toggle
 */

(() => {
  'use strict';

  // =========================================================================
  // CONSTANTS & STATE
  // =========================================================================
  const STORAGE_KEY_TASKS = 'taskflow_tasks_v1';
  const STORAGE_KEY_THEME = 'taskflow_theme';
  const STORAGE_KEY_VIEW = 'taskflow_view';

  // Initial Sample Data for first-time visitors / demo
  const SAMPLE_TASKS = [
    {
      id: 'task-1731230001001',
      title: 'Submit Project System Architecture & Design',
      description: 'Prepare detailed UML diagrams, API contract specifications, and modular structure documentation for the semester evaluation.',
      priority: 'high',
      category: 'Academics',
      createdAt: '2026-11-01T09:00:00.000Z',
      dueDate: getRelativeDateString(-2), // Overdue by 2 days
      completed: false
    },
    {
      id: 'task-1731230001002',
      title: 'Implement Responsive Frontend UI in CSS3',
      description: 'Ensure cross-device layout compatibility across mobile, tablet, and widescreen monitors with CSS Grid and Flexbox.',
      priority: 'high',
      category: 'Project',
      createdAt: '2026-11-04T10:30:00.000Z',
      dueDate: getRelativeDateString(0), // Due today
      completed: false
    },
    {
      id: 'task-1731230001003',
      title: 'Configure Browser Local Storage & Data Sync',
      description: 'Persist state updates safely with JSON serialization and handle empty state gracefully upon reload.',
      priority: 'medium',
      category: 'Work',
      createdAt: '2026-11-05T14:15:00.000Z',
      dueDate: getRelativeDateString(3), // Due in 3 days
      completed: true
    },
    {
      id: 'task-1731230001004',
      title: 'Conduct Cross-Browser Verification Testing',
      description: 'Validate accessibility landmarks, keyboard navigation, and contrast compliance on Chromium and Firefox.',
      priority: 'low',
      category: 'Work',
      createdAt: '2026-11-06T11:00:00.000Z',
      dueDate: getRelativeDateString(7), // Due in 7 days
      completed: false
    },
    {
      id: 'task-1731230001005',
      title: 'Compile Minor Project Report PDF & Deliverables',
      description: 'Assemble executive summary, system architecture diagrams, and testing logs into standardized submission format.',
      priority: 'medium',
      category: 'Academics',
      createdAt: '2026-11-07T16:00:00.000Z',
      dueDate: getRelativeDateString(5), // Due in 5 days
      completed: false
    }
  ];

  // Application State
  let tasks = [];
  let filterState = {
    search: '',
    status: 'all',     // 'all' | 'pending' | 'completed' | 'overdue'
    priority: 'all',   // 'all' | 'high' | 'medium' | 'low'
    sortBy: 'dueDate_asc'
  };
  let currentViewMode = 'grid'; // 'grid' | 'list'
  let deletingTaskId = null;

  // =========================================================================
  // DOM ELEMENT SELECTORS
  // =========================================================================
  const dom = {
    // Body & Theme
    body: document.body,
    themeToggleBtn: document.getElementById('themeToggleBtn'),

    // Dashboard Metric Counters
    statTotal: document.getElementById('statTotal'),
    statPending: document.getElementById('statPending'),
    statCompleted: document.getElementById('statCompleted'),
    statOverdue: document.getElementById('statOverdue'),
    statCards: document.querySelectorAll('.stat-card'),

    // Controls
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    statusFilter: document.getElementById('statusFilter'),
    priorityFilter: document.getElementById('priorityFilter'),
    sortBy: document.getElementById('sortBy'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    gridViewBtn: document.getElementById('gridViewBtn'),
    listViewBtn: document.getElementById('listViewBtn'),
    taskCountText: document.getElementById('taskCountText'),
    activeFilterBadge: document.getElementById('activeFilterBadge'),
    loadSampleDataBtn: document.getElementById('loadSampleDataBtn'),
    clearAllTasksBtn: document.getElementById('clearAllTasksBtn'),

    // Task List Container & Empty State
    taskListContainer: document.getElementById('taskListContainer'),
    emptyStateContainer: document.getElementById('emptyStateContainer'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    emptyStateActionBtn: document.getElementById('emptyStateActionBtn'),

    // Modals
    openCreateModalBtn: document.getElementById('openCreateModalBtn'),
    taskModal: document.getElementById('taskModal'),
    modalTitle: document.getElementById('modalTitle'),
    taskForm: document.getElementById('taskForm'),
    taskIdInput: document.getElementById('taskId'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskDescInput: document.getElementById('taskDescInput'),
    descCharCount: document.getElementById('descCharCount'),
    taskPriorityInput: document.getElementById('taskPriorityInput'),
    taskCategoryInput: document.getElementById('taskCategoryInput'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    saveBtnText: document.getElementById('saveBtnText'),
    titleError: document.getElementById('titleError'),
    dueDateError: document.getElementById('dueDateError'),

    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteTaskTitle: document.getElementById('deleteTaskTitle'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),

    // View Modal
    viewModal: document.getElementById('viewModal'),
    viewTaskTitle: document.getElementById('viewTaskTitle'),
    viewTaskPriorityBadge: document.getElementById('viewTaskPriorityBadge'),
    viewTaskCategoryBadge: document.getElementById('viewTaskCategoryBadge'),
    viewTaskStatusPill: document.getElementById('viewTaskStatusPill'),
    viewTaskDueDateBadge: document.getElementById('viewTaskDueDateBadge'),
    viewTaskDesc: document.getElementById('viewTaskDesc'),
    viewTaskCreatedAt: document.getElementById('viewTaskCreatedAt'),
    viewTaskDueDate: document.getElementById('viewTaskDueDate'),
    viewTaskStatus: document.getElementById('viewTaskStatus'),
    viewTaskId: document.getElementById('viewTaskId'),
    viewEditBtn: document.getElementById('viewEditBtn'),
    closeViewModalBtn: document.getElementById('closeViewModalBtn'),
    closeViewBtn: document.getElementById('closeViewBtn'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================

  /**
   * Generates a date string YYYY-MM-DD relative to today by offset days.
   */
  function getRelativeDateString(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  /**
   * Formats ISO or YYYY-MM-DD date into human-readable format (e.g. "Nov 15, 2026").
   */
  function formatDisplayDate(dateStr) {
    if (!dateStr) return 'No date';
    const date = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Calculates overdue status and human friendly due notice.
   */
  function getDueStatus(dueDateStr, isCompleted) {
    if (!dueDateStr) {
      return { isOverdue: false, isDueToday: false, label: 'No due date', cssClass: '' };
    }

    if (isCompleted) {
      return {
        isOverdue: false,
        isDueToday: false,
        label: `Completed (Due ${formatDisplayDate(dueDateStr)})`,
        cssClass: ''
      };
    }

    // Compare date components only (midnight to midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dueDateStr.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);

    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        isOverdue: true,
        isDueToday: false,
        label: `⚠️ Overdue by ${daysAgo} day${daysAgo > 1 ? 's' : ''}`,
        cssClass: 'overdue'
      };
    } else if (diffDays === 0) {
      return {
        isOverdue: false,
        isDueToday: true,
        label: `⏰ Due Today`,
        cssClass: 'due-today'
      };
    } else if (diffDays === 1) {
      return {
        isOverdue: false,
        isDueToday: false,
        label: `Due Tomorrow`,
        cssClass: ''
      };
    } else {
      return {
        isOverdue: false,
        isDueToday: false,
        label: `Due in ${diffDays} days (${formatDisplayDate(dueDateStr)})`,
        cssClass: ''
      };
    }
  }

  /**
   * Sanitizes string to prevent XSS during innerHTML injection.
   */
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // LOCAL STORAGE PERSISTENCE
  // =========================================================================

  function loadTasksFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TASKS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          tasks = parsed;
          return;
        }
      }
    } catch (err) {
      console.error('Error loading tasks from localStorage:', err);
    }

    // Default to sample tasks on first launch
    tasks = [...SAMPLE_TASKS];
    saveTasksToStorage(false);
  }

  function saveTasksToStorage(showToastNotification = false) {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      if (showToastNotification) {
        showToast('Changes saved to Local Storage', 'info');
      }
    } catch (err) {
      console.error('Error writing to localStorage:', err);
      showToast('Local storage quota exceeded or unavailable', 'danger');
    }
  }

  // =========================================================================
  // THEME & VIEW MODE HANDLING
  // =========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'light';
    setTheme(savedTheme);

    dom.themeToggleBtn.addEventListener('click', () => {
      const current = dom.body.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      setTheme(next);
      showToast(`Switched to ${next} mode`, 'info');
    });
  }

  function setTheme(theme) {
    dom.body.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }

  function initViewMode() {
    const savedView = localStorage.getItem(STORAGE_KEY_VIEW) || 'grid';
    setViewMode(savedView);

    dom.gridViewBtn.addEventListener('click', () => setViewMode('grid'));
    dom.listViewBtn.addEventListener('click', () => setViewMode('list'));
  }

  function setViewMode(mode) {
    currentViewMode = mode;
    localStorage.setItem(STORAGE_KEY_VIEW, mode);

    if (mode === 'grid') {
      dom.taskListContainer.classList.add('grid-view');
      dom.taskListContainer.classList.remove('list-view');
      dom.gridViewBtn.classList.add('active');
      dom.listViewBtn.classList.remove('active');
    } else {
      dom.taskListContainer.classList.add('list-view');
      dom.taskListContainer.classList.remove('grid-view');
      dom.listViewBtn.classList.add('active');
      dom.gridViewBtn.classList.remove('active');
    }
  }

  // =========================================================================
  // DASHBOARD STATISTICS
  // =========================================================================

  function updateDashboard() {
    const total = tasks.length;
    let pending = 0;
    let completed = 0;
    let overdue = 0;

    tasks.forEach(task => {
      if (task.completed) {
        completed++;
      } else {
        pending++;
        const status = getDueStatus(task.dueDate, false);
        if (status.isOverdue) {
          overdue++;
        }
      }
    });

    dom.statTotal.textContent = total;
    dom.statPending.textContent = pending;
    dom.statCompleted.textContent = completed;
    dom.statOverdue.textContent = overdue;

    // Highlight active card filter
    dom.statCards.forEach(card => {
      const cardFilter = card.getAttribute('data-filter');
      if (cardFilter === filterState.status) {
        card.classList.add('active-filter');
      } else {
        card.classList.remove('active-filter');
      }
    });
  }

  // =========================================================================
  // FILTERING, SEARCHING & SORTING
  // =========================================================================

  function getProcessedTasks() {
    return tasks
      .filter(task => {
        // Status Filter
        if (filterState.status === 'completed' && !task.completed) return false;
        if (filterState.status === 'pending' && task.completed) return false;
        if (filterState.status === 'overdue') {
          if (task.completed) return false;
          const status = getDueStatus(task.dueDate, false);
          if (!status.isOverdue) return false;
        }

        // Priority Filter
        if (filterState.priority !== 'all' && task.priority !== filterState.priority) {
          return false;
        }

        // Search Filter
        if (filterState.search.trim() !== '') {
          const q = filterState.search.toLowerCase().trim();
          const matchTitle = (task.title || '').toLowerCase().includes(q);
          const matchDesc = (task.description || '').toLowerCase().includes(q);
          const matchCategory = (task.category || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCategory) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (filterState.sortBy) {
          case 'dueDate_asc': {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
          }
          case 'dueDate_desc': {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return b.dueDate.localeCompare(a.dueDate);
          }
          case 'priority_desc': {
            const weights = { high: 3, medium: 2, low: 1 };
            return (weights[b.priority] || 0) - (weights[a.priority] || 0);
          }
          case 'priority_asc': {
            const weights = { high: 3, medium: 2, low: 1 };
            return (weights[a.priority] || 0) - (weights[b.priority] || 0);
          }
          case 'createdAt_desc': {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          }
          case 'createdAt_asc': {
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          }
          case 'title_asc': {
            return (a.title || '').localeCompare(b.title || '');
          }
          default:
            return 0;
        }
      });
  }

  // =========================================================================
  // RENDERING ENGINE
  // =========================================================================

  function renderTasks() {
    updateDashboard();

    const processedTasks = getProcessedTasks();
    const isFiltered = filterState.status !== 'all' || 
                       filterState.priority !== 'all' || 
                       filterState.search.trim() !== '';

    // Update filter badge visibility
    if (isFiltered) {
      dom.activeFilterBadge.classList.remove('hidden');
    } else {
      dom.activeFilterBadge.classList.add('hidden');
    }

    // Update task counter text
    dom.taskCountText.textContent = `Showing ${processedTasks.length} of ${tasks.length} task${tasks.length === 1 ? '' : 's'}`;

    // Handle Empty States
    if (processedTasks.length === 0) {
      dom.taskListContainer.innerHTML = '';
      dom.emptyStateContainer.classList.remove('hidden');

      if (tasks.length === 0) {
        dom.emptyStateTitle.textContent = 'No tasks yet';
        dom.emptyStateDesc.textContent = 'Create your first task or load the sample demo tasks to explore features.';
        dom.emptyStateActionBtn.textContent = '+ Create Your First Task';
        dom.emptyStateActionBtn.onclick = () => openCreateModal();
      } else {
        dom.emptyStateTitle.textContent = 'No matching tasks';
        dom.emptyStateDesc.textContent = 'No tasks matched your current search and filter criteria. Try resetting filters.';
        dom.emptyStateActionBtn.textContent = 'Clear All Filters';
        dom.emptyStateActionBtn.onclick = () => resetFilters();
      }
      return;
    }

    dom.emptyStateContainer.classList.add('hidden');

    // Build Cards HTML
    const cardsHTML = processedTasks.map(task => {
      const dueInfo = getDueStatus(task.dueDate, task.completed);
      const isOverdue = dueInfo.isOverdue;
      const completedClass = task.completed ? 'completed' : '';
      const overdueClass = isOverdue ? 'overdue-card' : '';
      const checkedAttr = task.completed ? 'checked' : '';

      return `
        <article class="task-card ${completedClass} ${overdueClass}" data-id="${task.id}">
          
          <div class="task-card-header">
            <div class="task-checkbox-wrapper">
              <input 
                type="checkbox" 
                class="task-checkbox" 
                aria-label="Mark task '${escapeHTML(task.title)}' as completed"
                data-id="${task.id}" 
                ${checkedAttr}>
            </div>

            <div class="task-header-content">
              <h3 class="task-card-title" data-action="view" data-id="${task.id}" title="Click to view details">
                ${escapeHTML(task.title)}
              </h3>
              
              <div class="badges-row">
                <span class="priority-badge ${task.priority}">
                  ${getPriorityIcon(task.priority)} ${task.priority.toUpperCase()}
                </span>
                ${task.category ? `<span class="category-badge">${escapeHTML(task.category)}</span>` : ''}
              </div>
            </div>
          </div>

          ${task.description ? `<p class="task-card-desc">${escapeHTML(task.description)}</p>` : ''}

          <div class="task-card-footer">
            <div class="due-badge ${dueInfo.cssClass}">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
              <span>${dueInfo.label}</span>
            </div>

            <div class="task-actions">
              <button class="btn-action action-view" data-action="view" data-id="${task.id}" title="View details" aria-label="View task">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
              </button>

              <button class="btn-action action-edit" data-action="edit" data-id="${task.id}" title="Edit task" aria-label="Edit task">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>

              <button class="btn-action action-delete" data-action="delete" data-id="${task.id}" title="Delete task" aria-label="Delete task">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

        </article>
      `;
    }).join('');

    dom.taskListContainer.innerHTML = cardsHTML;
  }

  function getPriorityIcon(priority) {
    switch (priority) {
      case 'high': return '●';
      case 'medium': return '▲';
      case 'low': return '◆';
      default: return '•';
    }
  }

  // =========================================================================
  // TASK CRUD OPERATIONS
  // =========================================================================

  /**
   * Toggles completion status of a task.
   */
  function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasksToStorage();
    renderTasks();

    if (task.completed) {
      showToast(`Task marked as Completed! 🎉`, 'success');
    } else {
      showToast(`Task marked as Pending`, 'info');
    }
  }

  /**
   * Opens the Create Task modal dialog.
   */
  function openCreateModal() {
    dom.modalTitle.textContent = 'Create New Task';
    dom.saveBtnText.textContent = 'Create Task';
    dom.taskIdInput.value = '';
    dom.taskForm.reset();
    clearValidationErrors();

    // Default due date to today
    dom.taskDueDateInput.value = getRelativeDateString(1);
    dom.taskPriorityInput.value = 'medium';
    dom.taskCategoryInput.value = 'Work';
    dom.descCharCount.textContent = '0';

    openModal(dom.taskModal);
    setTimeout(() => dom.taskTitleInput.focus(), 50);
  }

  /**
   * Opens Edit Task modal prefilled with task data.
   */
  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    dom.modalTitle.textContent = 'Edit Task';
    dom.saveBtnText.textContent = 'Update Task';
    dom.taskIdInput.value = task.id;
    dom.taskTitleInput.value = task.title;
    dom.taskDescInput.value = task.description || '';
    dom.taskPriorityInput.value = task.priority;
    dom.taskCategoryInput.value = task.category || 'Work';
    dom.taskDueDateInput.value = task.dueDate || '';
    dom.descCharCount.textContent = (task.description || '').length;

    clearValidationErrors();
    openModal(dom.taskModal);
    setTimeout(() => dom.taskTitleInput.focus(), 50);
  }

  /**
   * Validates form and handles Save (Create or Update).
   */
  function handleTaskFormSubmit(e) {
    e.preventDefault();
    clearValidationErrors();

    const title = dom.taskTitleInput.value.trim();
    const description = dom.taskDescInput.value.trim();
    const priority = dom.taskPriorityInput.value;
    const category = dom.taskCategoryInput.value;
    const dueDate = dom.taskDueDateInput.value;
    const existingId = dom.taskIdInput.value;

    let isValid = true;

    // Title validation
    if (!title) {
      showFieldError(dom.taskTitleInput, dom.titleError, 'Task title is required.');
      isValid = false;
    } else if (title.length < 3) {
      showFieldError(dom.taskTitleInput, dom.titleError, 'Title must be at least 3 characters.');
      isValid = false;
    }

    // Due Date validation
    if (!dueDate) {
      showFieldError(dom.taskDueDateInput, dom.dueDateError, 'Please select a valid due date.');
      isValid = false;
    }

    if (!isValid) return;

    if (existingId) {
      // Update existing task
      const task = tasks.find(t => t.id === existingId);
      if (task) {
        task.title = title;
        task.description = description;
        task.priority = priority;
        task.category = category;
        task.dueDate = dueDate;
        saveTasksToStorage();
        renderTasks();
        showToast('Task updated successfully!', 'success');
      }
    } else {
      // Create new task
      const newTask = {
        id: 'task-' + Date.now(),
        title,
        description,
        priority,
        category,
        createdAt: new Date().toISOString(),
        dueDate,
        completed: false
      };
      tasks.unshift(newTask);
      saveTasksToStorage();
      renderTasks();
      showToast('New task created successfully!', 'success');
    }

    closeModal(dom.taskModal);
  }

  /**
   * Opens the confirmation modal before permanent deletion.
   */
  function promptDeleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    deletingTaskId = id;
    dom.deleteTaskTitle.textContent = `"${task.title}"`;
    openModal(dom.deleteModal);
  }

  /**
   * Executes permanent deletion.
   */
  function confirmDeleteTask() {
    if (!deletingTaskId) return;

    const taskIndex = tasks.findIndex(t => t.id === deletingTaskId);
    if (taskIndex !== -1) {
      const removed = tasks.splice(taskIndex, 1)[0];
      saveTasksToStorage();
      renderTasks();
      showToast(`Task "${removed.title}" deleted.`, 'danger');
    }

    deletingTaskId = null;
    closeModal(dom.deleteModal);
  }

  /**
   * Opens the View Task modal for full reading.
   */
  function openViewModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    dom.viewTaskTitle.textContent = task.title;
    dom.viewTaskDesc.textContent = task.description || 'No additional notes provided for this task.';
    
    // Priority Badge
    dom.viewTaskPriorityBadge.className = `priority-badge ${task.priority}`;
    dom.viewTaskPriorityBadge.textContent = `${getPriorityIcon(task.priority)} ${task.priority.toUpperCase()}`;

    // Category
    dom.viewTaskCategoryBadge.textContent = task.category || 'General';

    // Status Pill
    dom.viewTaskStatusPill.className = `stat-pill ${task.completed ? 'status-completed-pill' : 'status-pending-pill'}`;
    dom.viewTaskStatusPill.textContent = task.completed ? 'Completed' : 'Pending';

    // Due Date
    const dueInfo = getDueStatus(task.dueDate, task.completed);
    dom.viewTaskDueDateBadge.className = `due-badge ${dueInfo.cssClass}`;
    dom.viewTaskDueDateBadge.textContent = dueInfo.label;

    // Metadata
    dom.viewTaskCreatedAt.textContent = formatDisplayDate(task.createdAt);
    dom.viewTaskDueDate.textContent = formatDisplayDate(task.dueDate);
    dom.viewTaskStatus.textContent = task.completed ? 'Completed' : 'Pending in progress';
    dom.viewTaskId.textContent = task.id;

    // Wire Edit Button inside View Modal
    dom.viewEditBtn.onclick = () => {
      closeModal(dom.viewModal);
      openEditModal(task.id);
    };

    openModal(dom.viewModal);
  }

  // =========================================================================
  // VALIDATION & MODAL CONTROLS
  // =========================================================================

  function showFieldError(inputEl, msgEl, message) {
    inputEl.classList.add('is-invalid');
    msgEl.textContent = message;
  }

  function clearValidationErrors() {
    dom.taskTitleInput.classList.remove('is-invalid');
    dom.taskDueDateInput.classList.remove('is-invalid');
    dom.titleError.textContent = '';
    dom.dueDateError.textContent = '';
  }

  function openModal(modalEl) {
    modalEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    modalEl.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function resetFilters() {
    filterState.search = '';
    filterState.status = 'all';
    filterState.priority = 'all';
    filterState.sortBy = 'dueDate_asc';

    dom.searchInput.value = '';
    dom.clearSearchBtn.classList.remove('visible');
    dom.statusFilter.value = 'all';
    dom.priorityFilter.value = 'all';
    dom.sortBy.value = 'dueDate_asc';

    renderTasks();
    showToast('Filters reset to default', 'info');
  }

  // =========================================================================
  // TOAST NOTIFICATIONS SYSTEM
  // =========================================================================

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'danger') icon = '🗑️';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-msg">${escapeHTML(message)}</span>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // =========================================================================
  // EVENT LISTENERS & SETUP
  // =========================================================================

  function setupEventListeners() {
    // Top Bar Actions
    dom.openCreateModalBtn.addEventListener('click', openCreateModal);

    // Dashboard Cards Quick Filtering
    dom.statCards.forEach(card => {
      card.addEventListener('click', () => {
        const filterType = card.getAttribute('data-filter');
        filterState.status = filterType;
        dom.statusFilter.value = filterType;
        renderTasks();
      });

      // Accessible keyboard support for stat cards
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Search Input with debounce
    let searchDebounceTimer = null;
    dom.searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length > 0) {
        dom.clearSearchBtn.classList.add('visible');
      } else {
        dom.clearSearchBtn.classList.remove('visible');
      }

      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        filterState.search = val;
        renderTasks();
      }, 150);
    });

    dom.clearSearchBtn.addEventListener('click', () => {
      dom.searchInput.value = '';
      dom.clearSearchBtn.classList.remove('visible');
      filterState.search = '';
      renderTasks();
      dom.searchInput.focus();
    });

    // Dropdown Filters
    dom.statusFilter.addEventListener('change', (e) => {
      filterState.status = e.target.value;
      renderTasks();
    });

    dom.priorityFilter.addEventListener('change', (e) => {
      filterState.priority = e.target.value;
      renderTasks();
    });

    dom.sortBy.addEventListener('change', (e) => {
      filterState.sortBy = e.target.value;
      renderTasks();
    });

    dom.resetFiltersBtn.addEventListener('click', resetFilters);

    // Batch / Demo Data actions
    dom.loadSampleDataBtn.addEventListener('click', () => {
      tasks = JSON.parse(JSON.stringify(SAMPLE_TASKS));
      saveTasksToStorage();
      resetFilters();
      showToast('Loaded 5 demonstration tasks!', 'success');
    });

    dom.clearAllTasksBtn.addEventListener('click', () => {
      if (tasks.length === 0) {
        showToast('Task list is already empty', 'info');
        return;
      }
      if (confirm('Clear all tasks permanently from Local Storage?')) {
        tasks = [];
        saveTasksToStorage();
        renderTasks();
        showToast('All tasks cleared', 'danger');
      }
    });

    // Form Submissions & Character counter
    dom.taskForm.addEventListener('submit', handleTaskFormSubmit);
    dom.closeModalBtn.addEventListener('click', () => closeModal(dom.taskModal));
    dom.cancelModalBtn.addEventListener('click', () => closeModal(dom.taskModal));

    dom.taskDescInput.addEventListener('input', (e) => {
      dom.descCharCount.textContent = e.target.value.length;
    });

    // Real-time title validation feedback
    dom.taskTitleInput.addEventListener('input', () => {
      if (dom.taskTitleInput.value.trim().length >= 3) {
        dom.taskTitleInput.classList.remove('is-invalid');
        dom.titleError.textContent = '';
      }
    });

    // Delete Modal Actions
    dom.confirmDeleteBtn.addEventListener('click', confirmDeleteTask);
    dom.cancelDeleteBtn.addEventListener('click', () => {
      deletingTaskId = null;
      closeModal(dom.deleteModal);
    });

    // View Modal Actions
    dom.closeViewModalBtn.addEventListener('click', () => closeModal(dom.viewModal));
    dom.closeViewBtn.addEventListener('click', () => closeModal(dom.viewModal));

    // Global Modal Backdrop Click to Close
    [dom.taskModal, dom.deleteModal, dom.viewModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    });

    // Global Escape Key to Close Modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal(dom.taskModal);
        closeModal(dom.deleteModal);
        closeModal(dom.viewModal);
      }
    });

    // Event Delegation for Task Cards (Checkbox, Title click, Action buttons)
    dom.taskListContainer.addEventListener('click', (e) => {
      const checkbox = e.target.closest('.task-checkbox');
      if (checkbox) {
        const taskId = checkbox.getAttribute('data-id');
        toggleTaskCompletion(taskId);
        return;
      }

      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        const taskId = actionBtn.getAttribute('data-id');

        if (action === 'view') {
          openViewModal(taskId);
        } else if (action === 'edit') {
          openEditModal(taskId);
        } else if (action === 'delete') {
          promptDeleteTask(taskId);
        }
      }
    });
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  function init() {
    initTheme();
    initViewMode();
    loadTasksFromStorage();
    setupEventListeners();
    renderTasks();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

