const storageKey = 'daily-focus-tasks-v1';
const taskForm = document.querySelector('#task-form');
const newTaskInput = document.querySelector('#new-task');
const formMessage = document.querySelector('#form-message');
const pendingList = document.querySelector('#pending-list');
const completedList = document.querySelector('#completed-list');
const pendingCount = document.querySelector('#pending-count');
const completedCount = document.querySelector('#completed-count');
const pendingEmpty = document.querySelector('#pending-empty');
const completedEmpty = document.querySelector('#completed-empty');
const clearCompletedButton = document.querySelector('#clear-completed');

let tasks = loadTasks();

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
}

function escapeHtml(value) {
  const entityMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return value.replace(/[&<>"']/g, (character) => entityMap[character]);
}

function renderTask(task) {
  const completedClass = task.completed ? ' completed' : '';
  const timestamp = task.completed ? `Completed ${formatDate(task.completedAt)}` : `Added ${formatDate(task.createdAt)}`;
  const toggleLabel = task.completed ? 'Mark as pending' : 'Mark complete';
  return `<li class="task-item${completedClass}" data-id="${task.id}">
    <button class="task-toggle" type="button" data-action="toggle" aria-label="${toggleLabel}">✓</button>
    <div class="task-content"><p class="task-title">${escapeHtml(task.text)}</p><p class="task-timestamp">${timestamp}</p></div>
    <div class="task-actions"><button class="icon-button" type="button" data-action="edit" aria-label="Edit task">✎</button><button class="icon-button delete" type="button" data-action="delete" aria-label="Delete task">×</button></div>
  </li>`;
}

function render() {
  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  pendingList.innerHTML = pendingTasks.map(renderTask).join('');
  completedList.innerHTML = completedTasks.map(renderTask).join('');
  pendingCount.textContent = `${pendingTasks.length} ${pendingTasks.length === 1 ? 'pending' : 'pending'}`;
  completedCount.textContent = `${completedTasks.length} ${completedTasks.length === 1 ? 'completed' : 'completed'}`;
  pendingEmpty.classList.toggle('visible', pendingTasks.length === 0);
  completedEmpty.classList.toggle('visible', completedTasks.length === 0);
  clearCompletedButton.disabled = completedTasks.length === 0;
}

function addTask(text) {
  tasks.unshift({ id: crypto.randomUUID(), text, completed: false, createdAt: Date.now(), completedAt: null });
  saveTasks();
  render();
}

function toggleTask(id) {
  tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed, completedAt: task.completed ? null : Date.now() } : task);
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function openEditor(taskItem, task) {
  const content = taskItem.querySelector('.task-content');
  content.innerHTML = `<input class="task-edit-input" type="text" value="${escapeHtml(task.text)}" maxlength="140" aria-label="Edit task text" /><div class="edit-controls"><button class="small-button save" type="button" data-action="save-edit">Save</button><button class="small-button" type="button" data-action="cancel-edit">Cancel</button></div>`;
  const input = content.querySelector('input');
  input.focus();
  input.select();
}

function saveEdit(taskItem, id) {
  const input = taskItem.querySelector('.task-edit-input');
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }
  tasks = tasks.map((task) => task.id === id ? { ...task, text } : task);
  saveTasks();
  render();
}

function handleListClick(event) {
  const action = event.target.closest('button')?.dataset.action;
  const taskItem = event.target.closest('.task-item');
  if (!action || !taskItem) return;
  const id = taskItem.dataset.id;
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  if (action === 'toggle') toggleTask(id);
  if (action === 'delete') deleteTask(id);
  if (action === 'edit') openEditor(taskItem, task);
  if (action === 'save-edit') saveEdit(taskItem, id);
  if (action === 'cancel-edit') render();
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = newTaskInput.value.trim();
  if (!text) {
    formMessage.textContent = 'Write a task before adding it.';
    newTaskInput.focus();
    return;
  }
  formMessage.textContent = '';
  addTask(text);
  taskForm.reset();
  newTaskInput.focus();
});

newTaskInput.addEventListener('input', () => { formMessage.textContent = ''; });
pendingList.addEventListener('click', handleListClick);
completedList.addEventListener('click', handleListClick);
clearCompletedButton.addEventListener('click', () => { tasks = tasks.filter((task) => !task.completed); saveTasks(); render(); });
document.querySelector('#today').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
render();
