const STORAGE_KEY = 'job-app-tracker-v2';
const statuses = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];
const form = document.getElementById('applicationForm');
const tbody = document.getElementById('applicationsBody');
const dashboard = document.getElementById('dashboard');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const seedBtn = document.getElementById('seedBtn');
const exportBtn = document.getElementById('exportBtn');
const importInput = document.getElementById('importInput');
const emptyState = document.getElementById('emptyState');
const tableView = document.getElementById('tableView');
const kanbanView = document.getElementById('kanbanView');
const tableViewBtn = document.getElementById('tableViewBtn');
const kanbanViewBtn = document.getElementById('kanbanViewBtn');
let currentView = 'table';

const loadApplications = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const saveApplications = (apps) => localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
const esc = (s='') => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function dueLabel(date) {
  if (!date) return '';
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = new Date(date + 'T00:00:00');
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return `<span class="due-badge due-soon">Overdue</span>`;
  if (diff <= 3) return `<span class="due-badge due-soon">Due soon</span>`;
  return `<span class="due-badge due-ok">Scheduled</span>`;
}

function renderDashboard(apps) {
  const counts = { Total: apps.length };
  statuses.forEach(s => counts[s] = apps.filter(a => a.status === s).length);
  counts['Due soon'] = apps.filter(a => a.followUpDate && /due-soon/.test(dueLabel(a.followUpDate))).length;
  dashboard.innerHTML = Object.entries(counts).map(([label, value]) => `<div class="card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join('');
}

function getFiltered(apps) {
  const status = statusFilter.value;
  const search = searchInput.value.trim().toLowerCase();
  return apps.filter(app => {
    const matchStatus = status === 'All' || app.status === status;
    const blob = `${app.company} ${app.title} ${app.location} ${app.source} ${app.notes}`.toLowerCase();
    return matchStatus && (!search || blob.includes(search));
  });
}

function renderTable(filtered) {
  tbody.innerHTML = filtered.map(app => `<tr>
    <td><strong>${esc(app.company)}</strong><div class="notes">${esc(app.notes || '')}</div></td>
    <td>${esc(app.title)}${app.link ? `<div><a href="${esc(app.link)}" target="_blank">Open link</a></div>` : ''}</td>
    <td><span class="status-badge status-${app.status}">${app.status}</span></td>
    <td><span class="priority-badge priority-${app.priority || 'Medium'}">${app.priority || 'Medium'}</span></td>
    <td>${esc(app.location || '-')}</td>
    <td class="dates">Applied: ${esc(app.appliedDate || '-')}<br>Follow-up: ${esc(app.followUpDate || '-')}<br>${dueLabel(app.followUpDate)}</td>
    <td>${esc(app.source || '-')}</td>
    <td><div class="actions">
      <select data-id="${app.id}" class="status-update">${statuses.map(s => `<option ${s===app.status?'selected':''}>${s}</option>`).join('')}</select>
      <button class="danger delete-btn" data-id="${app.id}">Delete</button>
    </div></td>
  </tr>`).join('');
}

function renderKanban(filtered) {
  kanbanView.innerHTML = statuses.map(status => {
    const items = filtered.filter(app => app.status === status);
    return `<div class="kanban-column"><div class="kanban-title">${status} (${items.length})</div><div class="kanban-stack">${items.map(app => `
      <div class="kanban-card">
        <h3>${esc(app.company)}</h3>
        <p>${esc(app.title)}</p>
        <div class="kanban-meta">
          <span class="priority-badge priority-${app.priority || 'Medium'}">${app.priority || 'Medium'}</span>
          ${dueLabel(app.followUpDate)}
        </div>
        <div class="notes">${esc(app.location || '')} ${app.source ? '• ' + esc(app.source) : ''}</div>
      </div>`).join('') || '<div class="notes">No items</div>'}</div></div>`;
  }).join('');
}

function render() {
  const apps = loadApplications();
  renderDashboard(apps);
  const filtered = getFiltered(apps);
  emptyState.classList.toggle('hidden', filtered.length !== 0);
  renderTable(filtered);
  renderKanban(filtered);
  tableView.classList.toggle('hidden', currentView !== 'table');
  kanbanView.classList.toggle('hidden', currentView !== 'kanban');
  tableViewBtn.classList.toggle('active', currentView === 'table');
  kanbanViewBtn.classList.toggle('active', currentView === 'kanban');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const app = Object.fromEntries(new FormData(form).entries());
  app.id = crypto.randomUUID();
  const apps = loadApplications();
  apps.unshift(app);
  saveApplications(apps);
  form.reset();
  render();
});

tbody.addEventListener('change', (e) => {
  if (!e.target.classList.contains('status-update')) return;
  const apps = loadApplications();
  const app = apps.find(a => a.id === e.target.dataset.id);
  if (app) app.status = e.target.value;
  saveApplications(apps);
  render();
});

tbody.addEventListener('click', (e) => {
  if (!e.target.classList.contains('delete-btn')) return;
  saveApplications(loadApplications().filter(a => a.id !== e.target.dataset.id));
  render();
});

statusFilter.addEventListener('change', render);
searchInput.addEventListener('input', render);
tableViewBtn.addEventListener('click', () => { currentView = 'table'; render(); });
kanbanViewBtn.addEventListener('click', () => { currentView = 'kanban'; render(); });

seedBtn.addEventListener('click', () => {
  if (loadApplications().length) return;
  saveApplications([
    { id: crypto.randomUUID(), company: 'Government of Canada', title: 'Systems Administrator', location: 'Ottawa', source: 'Job Bank', status: 'Applied', priority: 'High', appliedDate: '2026-04-01', followUpDate: '2026-04-05', link: '', notes: 'Potentially relevant public sector role.' },
    { id: crypto.randomUUID(), company: 'CBC/Radio-Canada', title: 'IT Support Analyst', location: 'Ottawa', source: 'LinkedIn', status: 'Interview', priority: 'Medium', appliedDate: '2026-03-28', followUpDate: '2026-04-03', link: '', notes: 'Follow up next week.' },
  ]);
  render();
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(loadApplications(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'job-applications-export.json';
  a.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('Invalid file format');
    saveApplications(data);
    render();
  } catch (err) {
    alert('Import failed: invalid JSON file');
  }
  e.target.value = '';
});

render();
