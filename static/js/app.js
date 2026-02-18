/**
 * DailyLog - Frontend JavaScript
 * Handles task management, API calls, and chart rendering
 */

// ============== State Management ==============
const state = {
    tasks: [],
    dailyStats: [],
    weeklyStats: null,
    taskToDelete: null,
    taskToEdit: null,
    taskToFootnote: null,
    viewDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format for local time
    theme: localStorage.getItem('theme') || 'light',
};

// Chart instances
let dailyChart = null;
let weeklyChart = null;

// ============== DOM Elements ==============
const elements = {
    currentDate: document.getElementById('current-date'),
    calendarIcon: document.getElementById('calendar-icon'),
    datePicker: document.getElementById('date-picker'),
    themeToggle: document.getElementById('theme-toggle'),
    starsToday: document.getElementById('stars-today'),
    tasksCompleted: document.getElementById('tasks-completed'),
    tasksTotal: document.getElementById('tasks-total'),
    taskProgress: document.getElementById('task-progress'),
    taskList: document.getElementById('task-list'),
    newTaskInput: document.getElementById('new-task-input'),
    addTaskBtn: document.getElementById('add-task-btn'),
    daysSelect: document.getElementById('days-select'),
    weekRange: document.getElementById('week-range'),
    weeklyLegend: document.getElementById('weekly-legend'),
    toast: document.getElementById('toast'),
    deleteModal: document.getElementById('delete-modal'),
    deleteTaskName: document.getElementById('delete-task-name'),
    cancelDelete: document.getElementById('cancel-delete'),
    confirmDelete: document.getElementById('confirm-delete'),

    // Edit Modal Elements
    editModal: document.getElementById('edit-modal'),
    editTaskInput: document.getElementById('edit-task-input'),
    cancelEdit: document.getElementById('cancel-edit'),
    confirmEdit: document.getElementById('confirm-edit'),

    // Footnote Modal Elements
    footnoteModal: document.getElementById('footnote-modal'),
    footnoteInput: document.getElementById('footnote-input'),
    cancelFootnote: document.getElementById('cancel-footnote'),
    confirmFootnote: document.getElementById('confirm-footnote'),

    // Date Navigation
    prevDayBtn: document.getElementById('prev-day-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
};

// ============== API Functions ==============
const api = {
    async fetchTasks(date) {
        let url = '/api/tasks';
        if (date) {
            url += `?date=${date}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json();
    },

    async addTask(name) {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add task');
        }
        return response.json();
    },

    async deleteTask(taskId) {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete task');
        return response.json();
    },

    async editTask(taskId, name) {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to edit task');
        }
        return response.json();
    },

    async completeTask(taskId, date) {
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date }),
        });
        if (!response.ok) throw new Error('Failed to complete task');
        return response.json();
    },

    async saveFootnote(taskId, date, footnote) {
        const response = await fetch(`/api/tasks/${taskId}/footnote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, footnote }),
        });
        if (!response.ok) throw new Error('Failed to save footnote');
        return response.json();
    },

    async uncompleteTask(taskId, date) {
        let url = `/api/tasks/${taskId}/complete`;
        if (date) {
            url += `?date=${date}`;
        }
        const response = await fetch(url, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to uncomplete task');
        return response.json();
    },

    async fetchDailyStats(days = 30) {
        const response = await fetch(`/api/stats/daily?days=${days}`);
        if (!response.ok) throw new Error('Failed to fetch daily stats');
        return response.json();
    },

    async fetchWeeklyStats(date) {
        let url = '/api/stats/weekly';
        if (date) {
            url += `?date=${date}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch weekly stats');
        return response.json();
    },

    async fetchTodayStats() {
        const response = await fetch('/api/stats/today');
        if (!response.ok) throw new Error('Failed to fetch today stats');
        return response.json();
    },

    async reorderTasks(taskIds) {
        const response = await fetch('/api/tasks/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskIds }),
        });
        if (!response.ok) throw new Error('Failed to reorder tasks');
        return response.json();
    },

    async fetchAverageStats(date, days = 7) {
        let url = `/api/stats/average?days=${days}`;
        if (date) {
            url += `&date=${date}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch average stats');
        return response.json();
    },
};

// ============== UI Rendering Functions ==============

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function updateCurrentDateDisplay() {
    const dateObj = new Date(state.viewDate);
    // Add timezone offset to prevent day shift due to UTC conversion
    const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset);

    elements.currentDate.textContent = formatDate(adjustedDate);

    // Check if viewed date is today
    const today = new Date().toLocaleDateString('en-CA');
    const isToday = state.viewDate === today;

    const bannerTitle = document.querySelector('.stats-banner .stat-label');
    if (bannerTitle) {
        bannerTitle.textContent = '7-Day Avg';
    }
}

function changeDate(offset) {
    const currentDate = new Date(state.viewDate);
    // Add offset
    currentDate.setDate(currentDate.getDate() + offset);

    // Convert back to YYYY-MM-DD
    // Note: locally constructed date via new Date(YYYY-MM-DD) assumes UTC in some contexts or local in others depending on parsing
    // but here we used ISO string "YYYY-MM-DD" which JS treats as UTC. 
    // Actually, safer to use consistent UTC components to avoid DST issues

    const year = currentDate.getUTCFullYear();
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getUTCDate()).padStart(2, '0');
    const newDateStr = `${year}-${month}-${day}`;

    state.viewDate = newDateStr;
    elements.datePicker.value = newDateStr; // Sync picker

    loadTasks();
    updateCurrentDateDisplay();
    // Charts will update via loadTasks -> updateStatsDisplay -> loadDailyStats/loadWeeklyStats calls if integrated
    // Actually loadTasks calls updateStatsDisplay.
    // We should also trigger chart reload
    loadDailyStats();
    loadWeeklyStats();
}

async function updateStatsDisplay() {
    const completedCount = state.tasks.filter(t => t.completed_today).length;
    const totalCount = state.tasks.length;

    // elements.starsToday.textContent = completedCount; // Old logic

    // Fetch and display 7-day average
    try {
        const avgStats = await api.fetchAverageStats(state.viewDate);
        elements.starsToday.textContent = avgStats.average;
    } catch (error) {
        console.error('Failed to update average stats:', error);
        elements.starsToday.textContent = '-';
    }
    elements.tasksCompleted.textContent = completedCount;
    elements.tasksTotal.textContent = totalCount;

    // Update progress bar
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    elements.taskProgress.style.width = `${progressPercent}%`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}



function updateThemeIcon() {
    const icon = elements.themeToggle.querySelector('.theme-icon');
    icon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    applyTheme();
    // Update charts if needed as they use canvas and might need re-rendering with new colors
    // For now simple refresh, ideally we update chart config
    loadDailyStats();
    loadWeeklyStats();
}

function renderTasks() {
    if (state.tasks.length === 0) {
        elements.taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p class="empty-state-text">No tasks yet. Add your first daily task!</p>
            </div>
        `;
        return;
    }

    elements.taskList.innerHTML = state.tasks.map((task, index) => `
        <div class="task-item ${task.completed_today ? 'completed' : ''}" data-task-id="${task.id}">
            <span class="task-number">${index + 1}.</span>
            <div class="task-checkbox" onclick="toggleTask(${task.id})"></div>
            <div class="task-content">
                <span class="task-name">${escapeHtml(task.name)}</span>
                ${task.footnote ? `<div class="task-footnote">${escapeHtml(task.footnote)}</div>` : ''}
            </div>
            <span class="task-star">⭐</span>
            <button class="task-btn task-footnote-btn ${task.footnote ? 'has-footnote' : ''}" 
                onclick="showFootnoteModal(${task.id}, '${escapeHtml(task.footnote || '')}')" 
                title="${task.footnote ? 'Edit footnote' : 'Add footnote'}">
                📝
            </button>
            <button class="task-edit" onclick="showEditModal(${task.id}, '${escapeHtml(task.name)}')" title="Edit task">
                ✏️
            </button>
            <button class="task-delete" onclick="promptDeleteTask(${task.id}, '${escapeHtml(task.name)}')" title="Delete task">
                🗑️
            </button>
        </div>
    `).join('');
}

// ============== Chart Functions ==============

const chartColors = [
    '#10b981', '#34d399', '#059669', '#064e3b', '#6ee7b7',
    '#047857', '#a7f3d0', '#065f46', '#3b82f6', '#f59e0b',
];

// Register the datalabels plugin globally or for specific charts
Chart.register(ChartDataLabels);

function renderDailyChart(stats) {
    const ctx = document.getElementById('daily-chart').getContext('2d');

    // Destroy existing chart
    if (dailyChart) {
        dailyChart.destroy();
    }

    const labels = stats.map(s => s.date);
    const data = stats.map(s => s.star_count);

    // Calculate max for better visualization
    const maxStars = Math.max(...data, 1);

    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stars',
                data: data,
                backgroundColor: data.map(v =>
                    v > 0 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(100, 116, 139, 0.3)'
                ),
                borderColor: data.map(v =>
                    v > 0 ? 'rgba(245, 158, 11, 1)' : 'rgba(100, 116, 139, 0.5)'
                ),
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(245, 158, 11, 0.5)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function (context) {
                            const index = context[0].dataIndex;
                            return stats[index].date;
                        },
                        label: function (context) {
                            return `${context.raw} star${context.raw !== 1 ? 's' : ''}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 11,
                        },
                    },
                },
                y: {
                    beginAtZero: true,
                    max: maxStars + 1,
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)',
                    },
                    ticks: {
                        color: '#64748b',
                        stepSize: 1,
                        font: {
                            size: 11,
                        },
                    },
                },
            },
            animation: {
                duration: 500,
                easing: 'easeOutQuart',
            },
        },
    });
}

function interpolateColor(count, max) {
    // Interpolate between White (#ffffff) and Dark Green (#064e3b)
    // Dark Green RGB: (6, 78, 59)
    if (count === 0) return '#ffffff';

    const ratio = Math.min(count / max, 1);

    // Lerp (White to Dark Green)
    // R: 255 -> 6
    // G: 255 -> 78
    // B: 255 -> 59

    const r = Math.round(255 + (6 - 255) * ratio);
    const g = Math.round(255 + (78 - 255) * ratio);
    const b = Math.round(255 + (59 - 255) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
}

function renderWeeklyChart(stats) {
    const ctx = document.getElementById('weekly-chart').getContext('2d');

    // Destroy existing chart
    if (weeklyChart) {
        weeklyChart.destroy();
    }

    // Update week range display
    if (stats.week_start && stats.week_end) {
        const start = new Date(stats.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = new Date(stats.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        elements.weekRange.textContent = `${start} - ${end}`;
    }

    // Prepare slices based on active tasks
    const tasks = stats.tasks || [];
    const labels = [];
    const data = [];
    const bgColors = [];
    const borderColors = [];

    // Fill slots for each task
    tasks.forEach(task => {
        // Equal slices
        data.push(1);

        labels.push(`${task.task_name} (${task.star_count}/7)`);

        // Calculate color based on stars earned in 7 days
        const color = interpolateColor(task.star_count, 7);
        bgColors.push(color);
        borderColors.push('#e2e8f0'); // Light border to separate slices
    });

    weeklyChart = new Chart(ctx, {
        type: 'pie', // Solid pie as requested
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                datalabels: {
                    color: '#1e293b', // Dark slate for visibility
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: function (value, context) {
                        return context.dataIndex + 1; // Show 1-based index
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            if (index < tasks.length) {
                                const task = tasks[index];
                                return `${task.task_name}: ${task.star_count}/7 stars (${task.percentage}%)`;
                            }
                            return 'Empty Slot';
                        },
                    },
                },
            },
            animation: {
                animateRotate: true,
                duration: 600,
            },
        },
    });

    // Render custom legend (Only for active tasks)
    elements.weeklyLegend.innerHTML = tasks.map((task, i) => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${interpolateColor(task.star_count, 7)}; border: 1px solid #cbd5e1;"></div>
            <span class="legend-name">${escapeHtml(task.task_name)}</span>
            <span class="legend-count">${task.star_count}/7</span>
        </div>
    `).join('');
}

// ============== Toast Notifications ==============

function showToast(message, type = 'success') {
    const toast = elements.toast;
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');

    icon.textContent = type === 'success' ? '✅' : '❌';
    messageEl.textContent = message;

    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============== Modal Functions ==============

function showDeleteModal(taskId, taskName) {
    state.taskToDelete = taskId;
    elements.deleteTaskName.textContent = taskName;
    elements.deleteModal.classList.add('show');
}

function hideDeleteModal() {
    state.taskToDelete = null;
    elements.deleteModal.classList.remove('show');
}

function showEditModal(taskId, currentName) {
    state.taskToEdit = taskId;
    elements.editTaskInput.value = currentName;
    elements.editModal.classList.add('show');
    elements.editTaskInput.focus();
}

function hideEditModal() {
    state.taskToEdit = null;
    elements.editModal.classList.remove('show');
}

async function saveTaskEdit() {
    if (!state.taskToEdit) return;

    const newName = elements.editTaskInput.value.trim();
    if (!newName) {
        showToast('Task name cannot be empty', 'error');
        return;
    }

    try {
        await api.editTask(state.taskToEdit, newName);

        // Update local state
        const taskIndex = state.tasks.findIndex(t => t.id === state.taskToEdit);
        if (taskIndex !== -1) {
            state.tasks[taskIndex].name = newName;
        }

        hideEditModal();
        renderTasks();
        showToast('Task updated successfully');
    } catch (error) {
        console.error('Error editing task:', error);
        showToast(error.message || 'Failed to update task', 'error');
    }
}

function showFootnoteModal(taskId, currentFootnote) {
    state.taskToFootnote = taskId;
    elements.footnoteInput.value = currentFootnote || ''; // Unescape if needed, but simple string passing works
    elements.footnoteModal.classList.add('show');
    elements.footnoteInput.focus();
}

function hideFootnoteModal() {
    state.taskToFootnote = null;
    elements.footnoteModal.classList.remove('show');
}

async function saveTaskFootnote() {
    if (!state.taskToFootnote) return;

    const footnote = elements.footnoteInput.value.trim();
    // Allow empty to clear it

    try {
        await api.saveFootnote(state.taskToFootnote, state.viewDate, footnote);

        // Update local state
        const taskIndex = state.tasks.findIndex(t => t.id === state.taskToFootnote);
        if (taskIndex !== -1) {
            state.tasks[taskIndex].footnote = footnote;
            // Also mark as completed since backend does it? 
            // My backend logic: INSERT creates completion. UPDATE maintains it.
            // So if it was not completed, it is now.
            // However, backend ONLY inserts/updates. It inserts a completion record.
            // So yes, it becomes completed.
            state.tasks[taskIndex].completed_today = true;
        }

        hideFootnoteModal();
        renderTasks();
        updateStatsDisplay();
        showToast('Footnote saved successfully');
    } catch (error) {
        console.error('Error saving footnote:', error);
        showToast(error.message || 'Failed to save footnote', 'error');
    }
}

// ============== Task Actions ==============

async function loadTasks() {
    try {
        state.tasks = await api.fetchTasks(state.viewDate);
        renderTasks();
        updateStatsDisplay();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showToast('Failed to load tasks', 'error');
    }
}

async function addTask() {
    const name = elements.newTaskInput.value.trim();
    if (!name) {
        showToast('Please enter a task name', 'error');
        return;
    }

    try {
        const newTask = await api.addTask(name);
        state.tasks.push(newTask);
        elements.newTaskInput.value = '';
        renderTasks();
        updateStatsDisplay();
        showToast('Task added successfully!');
    } catch (error) {
        console.error('Error adding task:', error);
        showToast(error.message || 'Failed to add task', 'error');
    }
}

async function toggleTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
        if (task.completed_today) {
            await api.uncompleteTask(taskId, state.viewDate);
            task.completed_today = false;
            showToast('Star removed');
        } else {
            await api.completeTask(taskId, state.viewDate);
            task.completed_today = true;
            showToast('⭐ Star earned!');
        }
        renderTasks();
        updateStatsDisplay();

        // Refresh charts
        loadDailyStats();
        loadWeeklyStats();
    } catch (error) {
        console.error('Error toggling task:', error);
        showToast('Failed to update task', 'error');
    }
}

function promptDeleteTask(taskId, taskName) {
    showDeleteModal(taskId, taskName);
}

async function deleteTask() {
    if (!state.taskToDelete) return;

    try {
        await api.deleteTask(state.taskToDelete);
        state.tasks = state.tasks.filter(t => t.id !== state.taskToDelete);
        hideDeleteModal();
        renderTasks();
        updateStatsDisplay();
        showToast('Task deleted (stars preserved)');
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
    }
}

// ============== Stats Loading ==============

async function loadDailyStats() {
    try {
        const days = parseInt(elements.daysSelect.value);
        state.dailyStats = await api.fetchDailyStats(days);
        renderDailyChart(state.dailyStats);
    } catch (error) {
        console.error('Error loading daily stats:', error);
    }
}

async function loadWeeklyStats() {
    try {
        state.weeklyStats = await api.fetchWeeklyStats(state.viewDate);
        renderWeeklyChart(state.weeklyStats);
    } catch (error) {
        console.error('Error loading weekly stats:', error);
    }
}

// ============== Event Listeners ==============

function setupEventListeners() {
    // Add task
    elements.addTaskBtn.addEventListener('click', addTask);
    elements.newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Days selector
    elements.daysSelect.addEventListener('change', loadDailyStats);

    // Delete modal
    elements.cancelDelete.addEventListener('click', hideDeleteModal);
    elements.confirmDelete.addEventListener('click', deleteTask);
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) hideDeleteModal();
    });

    // Edit modal
    elements.cancelEdit.addEventListener('click', hideEditModal);
    elements.confirmEdit.addEventListener('click', saveTaskEdit);
    elements.editModal.addEventListener('click', (e) => {
        if (e.target === elements.editModal) hideEditModal();
    });
    elements.editTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveTaskEdit();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideDeleteModal();
            hideEditModal();
            hideFootnoteModal();
        }
    });

    // Footnote modal
    elements.cancelFootnote.addEventListener('click', hideFootnoteModal);
    elements.confirmFootnote.addEventListener('click', saveTaskFootnote);
    elements.footnoteModal.addEventListener('click', (e) => {
        if (e.target === elements.footnoteModal) hideFootnoteModal();
    });
    elements.footnoteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveTaskFootnote();
    });

    // Date picker
    elements.datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            state.viewDate = e.target.value;
            loadTasks();
            updateCurrentDateDisplay();
        }
    });

    // Manually trigger date picker on icon click
    elements.calendarIcon.addEventListener('click', () => {
        try {
            // Modern API
            if (elements.datePicker.showPicker) {
                elements.datePicker.showPicker();
            } else {
                // Fallback for older browsers
                elements.datePicker.click();
            }
        } catch (error) {
            console.error('Error opening date picker:', error);
            // Fallback try click if showPicker failed (e.g. some context restriction)
            elements.datePicker.click();
        }
    });

    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Date Navigation Buttons
    elements.prevDayBtn.addEventListener('click', () => changeDate(-1));
    elements.nextDayBtn.addEventListener('click', () => changeDate(1));

    // Keyboard Shortcuts for Date Navigation
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input or textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        if (e.key === 'ArrowLeft') {
            changeDate(-1);
        } else if (e.key === 'ArrowRight') {
            changeDate(1);
        }
    });
}

// ============== Sortable Implementation ==============

function initSortable() {
    new Sortable(elements.taskList, {
        animation: 150,
        handle: '.task-item', // Whole item is draggable, or we could add a handle
        ghostClass: 'sortable-ghost', // Class name for the drop placeholder
        dragClass: 'sortable-drag',  // Class name for the dragging item
        delay: 200, // Ms delay to prevent accidental drags on touch
        delayOnTouchOnly: true,
        onEnd: async function (evt) {
            // Get new order
            const taskItems = Array.from(elements.taskList.children);
            const taskIds = taskItems
                .map(item => item.getAttribute('data-task-id'))
                .filter(id => id); // Filter out empty states or non-task elements

            // Allow empty state to be ignored
            if (taskIds.length === 0) return;

            // Optimistic update (UI is already updated by Sortable)

            try {
                await api.reorderTasks(taskIds);
                // No need for toast here as it's a frequent action
            } catch (error) {
                console.error('Error reordering tasks:', error);
                showToast('Failed to save order', 'error');
                // Revert changes on error? (Refetching tasks is simplest)
                loadTasks();
            }
        },
    });
}

// ============== Initialization ==============

async function init() {
    // Initialize theme
    applyTheme();

    // Set initial date picker value
    elements.datePicker.value = state.viewDate;
    updateCurrentDateDisplay();
    setupEventListeners();

    // Load initial data
    await loadTasks();
    await loadDailyStats();
    await loadWeeklyStats();

    // Initialize Sortable
    initSortable();

    // Update date at midnight
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            // Only update if viewing today
            const today = new Date().toLocaleDateString('en-CA');
            if (state.viewDate === today) {
                updateCurrentDateDisplay();
                loadTasks();
                loadDailyStats();
                loadWeeklyStats();
            }
        }
    }, 60000); // Check every minute
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
