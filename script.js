// Task Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentSort = { field: 'date', ascending: true };

// Theme Management
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('change', () => {
    document.body.setAttribute('data-theme', themeToggle.checked ? 'dark' : 'light');
    localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
});

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);
themeToggle.checked = savedTheme === 'dark';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    updateStats();
    
    // Add task button
    document.getElementById('addTask').addEventListener('click', addTask);
    
    // Task input - Enter key
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // Search input
    document.getElementById('searchInput').addEventListener('input', filterTasks);
    
    // Filter selects
    document.getElementById('filterPriority').addEventListener('change', filterTasks);
    document.getElementById('filterStatus').addEventListener('change', filterTasks);
    
    // Sort button
    document.getElementById('sortTasks').addEventListener('click', () => {
        currentSort.ascending = !currentSort.ascending;
        renderTasks();
    });
    
    // Clear buttons
    document.getElementById('clearCompleted').addEventListener('click', clearCompleted);
    document.getElementById('clearAll').addEventListener('click', clearAll);
});

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskText = taskInput.value.trim();
    const dueDate = document.getElementById('dueDate').value;
    const priority = document.getElementById('priority').value;

    if (taskText) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            date: new Date().toISOString(),
            dueDate: dueDate,
            priority: priority,
            timeSpent: 0
        };

        tasks.push(task);
        saveTasks();
        renderTasks();
        updateStats();
        
        // Clear inputs
        taskInput.value = '';
        document.getElementById('dueDate').value = '';
        document.getElementById('priority').value = 'low';
    }
}

function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const newText = prompt('Edit task:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            task.lastEdited = new Date().toISOString();
            saveTasks();
            renderTasks();
        }
    }
}

function filterTasks() {
    renderTasks();
}

function getFilteredTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const priorityFilter = document.getElementById('filterPriority').value;
    const statusFilter = document.getElementById('filterStatus').value;

    return tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchTerm);
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'completed' && task.completed) || 
            (statusFilter === 'pending' && !task.completed);

        return matchesSearch && matchesPriority && matchesStatus;
    });
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    let filteredTasks = getFilteredTasks();
    
    // Sort tasks
    filteredTasks.sort((a, b) => {
        const factor = currentSort.ascending ? 1 : -1;
        if (a.priority !== b.priority) {
            const priorities = { high: 3, medium: 2, low: 1 };
            return (priorities[b.priority] - priorities[a.priority]) * factor;
        }
        return (new Date(b.date) - new Date(a.date)) * factor;
    });

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        // Format due date
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        
        li.innerHTML = `
            <input type="checkbox" 
                   class="task-checkbox" 
                   ${task.completed ? 'checked' : ''}
                   onclick="toggleTask(${task.id})">
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <span class="task-details">
                    Due: ${dueDate} | Created: ${new Date(task.date).toLocaleDateString()}
                    ${task.lastEdited ? ` | Edited: ${new Date(task.lastEdited).toLocaleDateString()}` : ''}
                </span>
            </div>
            <span class="task-priority priority-${task.priority}">${task.priority}</span>
            <div class="task-actions">
                <button class="edit-btn" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        taskList.appendChild(li);
    });
}

function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
}

function clearCompleted() {
    if (confirm('Are you sure you want to clear all completed tasks?')) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function clearAll() {
    if (confirm('Are you sure you want to clear all tasks? This cannot be undone.')) {
        tasks = [];
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add task
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        addTask();
    }
    
    // Ctrl/Cmd + / to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});

// Add drag and drop functionality
let draggedTask = null;

document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('task-item')) {
        draggedTask = e.target;
        e.target.style.opacity = '0.5';
    }
});

document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('task-item')) {
        e.target.style.opacity = '1';
    }
});

document.getElementById('taskList').addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(e.clientY);
    const draggable = document.querySelector('.dragging');
    if (afterElement == null) {
        taskList.appendChild(draggable);
    } else {
        taskList.insertBefore(draggable, afterElement);
    }
});

function getDragAfterElement(y) {
    const draggableElements = [...document.querySelectorAll('.task-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}