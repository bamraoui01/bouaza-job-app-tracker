const STORAGE_KEY = 'job-app-tracker-v1';
const statuses = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];
const form = document.getElementById('applicationForm');
const tbody = document.getElementById('applicationsBody');
const dashboard = document.getElementById('dashboard');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const seedBtn = document.getElementById('seedBtn');
const emptyState = document.getElementById('emptyState');
const loadApplications = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const saveApplications = (apps) => localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
function renderDashboard(apps){const counts={Total:apps.length};statuses.forEach(s=>counts[s]=apps.filter(a=>a.status===s).length);dashboard.innerHTML=Object.entries(counts).map(([label,value])=>`<div class="card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join('')}
function getFiltered(apps){const status=statusFilter.value;const search=searchInput.value.trim().toLowerCase();return apps.filter(app=>{const matchStatus=status==='All'||app.status===status;const blob=`${app.company} ${app.title} ${app.location} ${app.source}`.toLowerCase();const matchSearch=!search||blob.includes(search);return matchStatus&&matchSearch})}
function render(){const apps=loadApplications();renderDashboard(apps);const filtered=getFiltered(apps);emptyState.classList.toggle('hidden',filtered.length!==0);tbody.innerHTML=filtered.map(app=>`<tr><td><strong>${app.company}</strong><div class="notes">${app.notes||''}</div></td><td>${app.title}${app.link?`<div><a href="${app.link}" target="_blank">Open link</a></div>`:''}</td><td><span class="status-badge status-${app.status}">${app.status}</span></td><td>${app.location||'-'}</td><td>${app.appliedDate||'-'}</td><td>${app.source||'-'}</td><td><div class="actions"><select data-id="${app.id}" class="status-update">${statuses.map(s=>`<option ${s===app.status?'selected':''}>${s}</option>`).join('')}</select><button class="danger delete-btn" data-id="${app.id}">Delete</button></div></td></tr>`).join('')}
form.addEventListener('submit',(e)=>{e.preventDefault();const data=new FormData(form);const app=Object.fromEntries(data.entries());app.id=crypto.randomUUID();const apps=loadApplications();apps.unshift(app);saveApplications(apps);form.reset();render()});
tbody.addEventListener('change',(e)=>{if(!e.target.classList.contains('status-update')) return;const apps=loadApplications();const app=apps.find(a=>a.id===e.target.dataset.id);if(app) app.status=e.target.value;saveApplications(apps);render()});
tbody.addEventListener('click',(e)=>{if(!e.target.classList.contains('delete-btn')) return;const apps=loadApplications().filter(a=>a.id!==e.target.dataset.id);saveApplications(apps);render()});
statusFilter.addEventListener('change',render);searchInput.addEventListener('input',render);
seedBtn.addEventListener('click',()=>{if(loadApplications().length) return;saveApplications([{id:crypto.randomUUID(),company:'Government of Canada',title:'Systems Administrator',location:'Ottawa',source:'Job Bank',status:'Applied',appliedDate:'2026-04-01',link:'',notes:'Potentially relevant public sector role.'},{id:crypto.randomUUID(),company:'CBC/Radio-Canada',title:'IT Support Analyst',location:'Ottawa',source:'LinkedIn',status:'Interview',appliedDate:'2026-03-28',link:'',notes:'Follow up next week.'}]);render()});
render();
