let activities = [];
let locations = [];
let trainers = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('admin');
  if (!user) return;
  renderNav('sessions');
  await loadFormData();
  loadSessions();

  let timer;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(loadSessions, 400);
  });
  document.getElementById('activityFilter').addEventListener('change', loadSessions);
});

async function loadFormData() {
  try {
    const [actData, locData, userdata] = await Promise.all([
      api.get('/activities'),
      api.get('/locations'),
      api.get('/users?role=trainer&status=active')
    ]);
    activities = actData.activities || [];
    locations = locData.locations || [];
    trainers = userdata.users || [];

    const actFilter = document.getElementById('activityFilter');
    activities.forEach(a => actFilter.innerHTML += `<option value="${a.id}">${a.name}</option>`);

    populateFormDropdowns();
  } catch (e) { console.error(e); }
}

function populateFormDropdowns() {
  const sActivity = document.getElementById('sActivity');
  const sLocation = document.getElementById('sLocation');
  const sTrainer = document.getElementById('sTrainer');

  activities.forEach(a => sActivity.innerHTML += `<option value="${a.id}">${a.name}</option>`);
  locations.forEach(l => sLocation.innerHTML += `<option value="${l.id}">${l.name}</option>`);
  trainers.forEach(t => sTrainer.innerHTML += `<option value="${t.id}">${t.name}</option>`);
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('activityFilter').value = '';
  loadSessions();
}

async function loadSessions() {
  const tbody = document.getElementById('sessionsTable');
  const search = document.getElementById('searchInput').value.trim();
  const activity_id = document.getElementById('activityFilter').value;

  let url = '/sessions?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (activity_id) url += `activity_id=${activity_id}`;

  tbody.innerHTML = `<tr><td colspan="7"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;

  try {
    const data = await api.get(url);
    const sessions = data.sessions || [];

    if (sessions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-calendar-times"></i><p>No sessions found.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = sessions.map(s => `
      <tr>
        <td>
          <div style="font-weight:600;font-size:0.875rem;">${s.name}</div>
        </td>
        <td style="font-size:0.875rem;">${s.activity_name || '-'}</td>
        <td style="font-size:0.875rem;">${s.trainer_name || '-'}</td>
        <td>
          <div style="font-size:0.875rem;">${formatDate(s.date)}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">${formatTime(s.time)} &bull; ${s.duration_minutes}min</div>
        </td>
        <td style="font-size:0.875rem;">${s.location_name || '-'}</td>
        <td>
          <span style="font-size:0.875rem;">${s.booked_count}/${s.max_participants}</span>
          <div style="width:60px;height:5px;background:#e5e7eb;border-radius:3px;margin-top:4px;">
            <div style="width:${Math.min(100,Math.round(s.booked_count/s.max_participants*100))}%;height:100%;background:var(--accent-gold);border-radius:3px;"></div>
          </div>
        </td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-sm btn-secondary" onclick="openEditModal(${s.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteSession(${s.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="alert alert-danger">${err.message}</div></td></tr>`;
  }
}

function clearModalForm() {
  document.getElementById('sActivity').value = '';
  document.getElementById('sLocation').value = '';
  document.getElementById('sTrainer').value = '';
  document.getElementById('sDate').value = '';
  document.getElementById('sTime').value = '09:00';
  document.getElementById('sDuration').value = '60';
  document.getElementById('sMaxP').value = '20';
  document.getElementById('sDescription').value = '';
  document.getElementById('editSessionId').value = '';
}

function openCreateModal() {
  document.getElementById('sessionModalTitle').textContent = 'Add Session';
  clearModalForm();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('sDate').value = tomorrow.toISOString().slice(0, 10);
  document.getElementById('sessionModal').classList.add('active');
}

async function openEditModal(id) {
  try {
    const data = await api.get(`/sessions/${id}`);
    const s = data.session;
    document.getElementById('sessionModalTitle').textContent = 'Edit Session';
    document.getElementById('sActivity').value = s.activity_id || '';
    document.getElementById('sLocation').value = s.location_id || '';
    document.getElementById('sTrainer').value = s.trainer_id || '';
    document.getElementById('sDate').value = s.date ? String(s.date).slice(0, 10) : '';
    document.getElementById('sTime').value = s.time ? String(s.time).slice(0, 5) : '';
    document.getElementById('sDuration').value = s.duration_minutes;
    document.getElementById('sMaxP').value = s.max_participants;
    document.getElementById('sDescription').value = s.description || '';
    document.getElementById('editSessionId').value = s.id;
    document.getElementById('sessionModal').classList.add('active');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

async function saveSession() {
  const editId = document.getElementById('editSessionId').value;
  const actSelect = document.getElementById('sActivity');
  const name = actSelect.options[actSelect.selectedIndex]?.text || 'Session';
  const date = document.getElementById('sDate').value;
  const time = document.getElementById('sTime').value;

  if (!date || !time) {
    showToast('Date and time are required.', 'error');
    return;
  }

  const body = {
    name,
    activity_id: document.getElementById('sActivity').value || null,
    location_id: document.getElementById('sLocation').value || null,
    trainer_id: document.getElementById('sTrainer').value || null,
    date, time,
    duration_minutes: parseInt(document.getElementById('sDuration').value),
    max_participants: parseInt(document.getElementById('sMaxP').value),
    description: document.getElementById('sDescription').value.trim()
  };

  try {
    if (editId) {
      await api.put(`/sessions/${editId}`, body);
      showToast('Session updated!', 'success');
    } else {
      await api.post('/sessions', body);
      showToast('Session created!', 'success');
    }
    closeModal('sessionModal');
    loadSessions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteSession(id) {
  showConfirm('Delete Session', 'Delete this session and all its bookings?', async () => {
    try {
      await api.delete(`/sessions/${id}`);
      showToast('Session deleted.', 'success');
      loadSessions();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
