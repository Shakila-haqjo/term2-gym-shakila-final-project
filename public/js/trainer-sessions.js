let activities = [];
let locations = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('trainer');
  if (!user) return;
  renderNav('sessions');
  await Promise.all([loadActivities(), loadLocations()]);
  loadSessions();

  let timer;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(loadSessions, 400);
  });
  document.getElementById('upcomingFilter').addEventListener('change', loadSessions);
});

async function loadActivities() {
  try {
    const data = await api.get('/activities');
    activities = data.activities || [];
  } catch (e) {}
}

async function loadLocations() {
  try {
    const data = await api.get('/locations');
    locations = data.locations || [];
  } catch (e) {}
}

async function loadSessions() {
  const tbody = document.getElementById('sessionsTable');
  const search = document.getElementById('searchInput').value.trim();
  const upcoming = document.getElementById('upcomingFilter').value;

  let url = '/sessions?mine=true&';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (upcoming) url += `upcoming=${upcoming}`;

  tbody.innerHTML = `<tr><td colspan="6"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;

  try {
    const data = await api.get(url);
    const sessions = data.sessions || [];

    if (sessions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-calendar-times"></i><p>No sessions found. <a href="/trainer/create-session" style="color:var(--accent-gold)">Create one</a></p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = sessions.map(s => `
      <tr>
        <td>
          <div style="font-weight:600;">${s.name}</div>
          ${s.description ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">${s.description.slice(0,60)}${s.description.length>60?'...':''}</div>` : ''}
        </td>
        <td>${s.activity_name || '-'}</td>
        <td>
          <div>${formatDate(s.date)}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">${formatTime(s.time)} &bull; ${s.duration_minutes} min</div>
        </td>
        <td>${s.location_name || '-'}</td>
        <td>
          <span style="font-size:0.875rem;">${s.booked_count}/${s.max_participants}</span>
          <div style="width:60px;height:5px;background:#e5e7eb;border-radius:3px;margin-top:4px;">
            <div style="width:${Math.round(s.booked_count/s.max_participants*100)}%;height:100%;background:var(--accent-gold);border-radius:3px;"></div>
          </div>
        </td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <a href="/trainer/session-bookings?id=${s.id}" class="btn btn-sm btn-info"><i class="fas fa-users"></i></a>
            <button class="btn btn-sm btn-secondary" onclick="openEditModal(${s.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteSession(${s.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="alert alert-danger">${err.message}</div></td></tr>`;
  }
}

function buildSessionForm(session) {
  const actOptions = activities.map(a => `<option value="${a.id}" ${session && session.activity_id === a.id ? 'selected' : ''}>${a.name}</option>`).join('');
  const locOptions = locations.map(l => `<option value="${l.id}" ${session && session.location_id === l.id ? 'selected' : ''}>${l.name}</option>`).join('');

  return `
    <div class="form-group">
      <label class="form-label">Session Name *</label>
      <input type="text" id="eName" class="form-control" value="${session ? session.name : ''}" placeholder="Session name">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Activity</label>
        <select id="eActivity" class="form-control"><option value="">Select...</option>${actOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Location</label>
        <select id="eLocation" class="form-control"><option value="">Select...</option>${locOptions}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date *</label>
        <input type="date" id="eDate" class="form-control" value="${session ? session.date : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Time *</label>
        <input type="time" id="eTime" class="form-control" value="${session ? session.time : ''}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Duration (min)</label>
        <input type="number" id="eDuration" class="form-control" value="${session ? session.duration_minutes : 60}" min="15">
      </div>
      <div class="form-group">
        <label class="form-label">Max Participants</label>
        <input type="number" id="eMaxP" class="form-control" value="${session ? session.max_participants : 20}" min="1">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea id="eDescription" class="form-control">${session ? (session.description || '') : ''}</textarea>
    </div>
  `;
}

async function openEditModal(id) {
  editingId = id;
  try {
    const data = await api.get(`/sessions/${id}`);
    document.getElementById('editModalBody').innerHTML = buildSessionForm(data.session);
    document.getElementById('editModal').classList.add('active');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function saveSession() {
  const name = document.getElementById('eName').value.trim();
  const date = document.getElementById('eDate').value;
  const time = document.getElementById('eTime').value;

  if (!name || !date || !time) {
    showToast('Name, date, and time are required.', 'error');
    return;
  }

  const body = {
    name,
    activity_id: document.getElementById('eActivity').value || null,
    location_id: document.getElementById('eLocation').value || null,
    date, time,
    duration_minutes: parseInt(document.getElementById('eDuration').value),
    max_participants: parseInt(document.getElementById('eMaxP').value),
    description: document.getElementById('eDescription').value.trim()
  };

  try {
    await api.put(`/sessions/${editingId}`, body);
    closeModal('editModal');
    showToast('Session updated!', 'success');
    loadSessions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

async function deleteSession(id) {
  showConfirm('Delete Session', 'This will also remove all bookings for this session. Continue?', async () => {
    try {
      await api.delete(`/sessions/${id}`);
      showToast('Session deleted.', 'success');
      loadSessions();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
