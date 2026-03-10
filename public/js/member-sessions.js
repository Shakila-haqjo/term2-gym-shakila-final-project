let activities = [];
let myBookings = [];
let selectedSessionId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('member');
  if (!user) return;
  renderNav('sessions');
  await Promise.all([loadActivities(), loadMyBookings()]);
  loadSessions();

  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadSessions, 400);
  });
});

async function loadActivities() {
  try {
    const data = await api.get('/activities');
    activities = data.activities || [];
    const select = document.getElementById('activityFilter');
    activities.forEach(a => {
      select.innerHTML += `<option value="${a.id}">${a.name}</option>`;
    });
  } catch (e) {}
}

async function loadMyBookings() {
  try {
    const data = await api.get('/bookings');
    myBookings = data.bookings || [];
  } catch (e) {}
}

async function loadSessions() {
  const grid = document.getElementById('sessionGrid');
  const search = document.getElementById('searchInput').value.trim();
  const activity_id = document.getElementById('activityFilter').value;
  const upcoming = document.getElementById('upcomingFilter').value;

  let url = '/sessions?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (activity_id) url += `activity_id=${activity_id}&`;
  if (upcoming) url += `upcoming=${upcoming}`;

  grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;"><div class="spinner"></div></div>';

  try {
    const data = await api.get(url);
    const sessions = data.sessions || [];

    if (sessions.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-calendar-times"></i><p>No sessions found.</p></div>`;
      return;
    }

    grid.innerHTML = sessions.map(s => {
      const myBooking = myBookings.find(b => b.session_id === s.id && b.status === 'confirmed');
      const isFull = s.booked_count >= s.max_participants;
      const isPast = s.date < new Date().toISOString().slice(0, 10);
      const pct = Math.round((s.booked_count / s.max_participants) * 100);
      const fillClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';

      return `
        <div class="session-card">
          <div class="session-card-header">
            <div class="activity-badge">${s.activity_name || 'General'}</div>
            <h3>${s.name}</h3>
          </div>
          <div class="session-card-body">
            <div class="session-meta">
              <div class="session-meta-item"><i class="fas fa-calendar"></i> ${formatDate(s.date)}</div>
              <div class="session-meta-item"><i class="fas fa-clock"></i> ${formatTime(s.time)} (${s.duration_minutes} min)</div>
              <div class="session-meta-item"><i class="fas fa-map-marker-alt"></i> ${s.location_name || 'TBD'}</div>
              <div class="session-meta-item"><i class="fas fa-user-tie"></i> ${s.trainer_name || 'TBD'}</div>
            </div>
            ${s.description ? `<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">${s.description}</p>` : ''}
            <div class="session-capacity">
              <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-secondary);">
                <span><i class="fas fa-users"></i> ${s.booked_count}/${s.max_participants} booked</span>
                <span>${s.max_participants - s.booked_count} spots left</span>
              </div>
              <div class="capacity-bar"><div class="capacity-fill ${fillClass}" style="width:${pct}%"></div></div>
            </div>
            ${myBooking
              ? `<button class="btn btn-secondary w-100" disabled><i class="fas fa-check"></i> Already Booked</button>`
              : isPast
                ? `<button class="btn btn-secondary w-100" disabled><i class="fas fa-ban"></i> Session Ended</button>`
                : isFull
                  ? `<button class="btn btn-secondary w-100" disabled><i class="fas fa-lock"></i> Session Full</button>`
                  : `<button class="btn btn-primary w-100" onclick="openBookModal(${s.id}, '${s.name}', '${s.date}', '${s.time}', '${s.trainer_name || ''}')">
                      <i class="fas fa-ticket-alt"></i> Book Session
                    </button>`
            }
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-exclamation-circle"></i><p>${err.message}</p></div>`;
  }
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('activityFilter').value = '';
  document.getElementById('upcomingFilter').value = 'true';
  loadSessions();
}

function openBookModal(id, name, date, time, trainer) {
  selectedSessionId = id;
  document.getElementById('bookModalBody').innerHTML = `
    <div style="margin-bottom:16px;">
      <h3 style="font-size:1.05rem;font-weight:600;margin-bottom:12px;">${name}</h3>
      <div style="display:flex;flex-direction:column;gap:8px;font-size:0.875rem;color:var(--text-secondary);">
        <div><i class="fas fa-calendar" style="color:var(--accent-gold);width:20px;"></i> ${formatDate(date)}</div>
        <div><i class="fas fa-clock" style="color:var(--accent-gold);width:20px;"></i> ${formatTime(time)}</div>
        ${trainer ? `<div><i class="fas fa-user-tie" style="color:var(--accent-gold);width:20px;"></i> ${trainer}</div>` : ''}
      </div>
    </div>
    <div class="alert alert-info"><i class="fas fa-info-circle"></i> You can cancel your booking at any time from My Bookings.</div>
  `;
  document.getElementById('bookModal').classList.add('active');

  document.getElementById('confirmBookBtn').onclick = confirmBook;
}

function closeBookModal() {
  document.getElementById('bookModal').classList.remove('active');
  selectedSessionId = null;
}

async function confirmBook() {
  const btn = document.getElementById('confirmBookBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';

  try {
    await api.post('/bookings', { session_id: selectedSessionId });
    closeBookModal();
    showToast('Session booked successfully!', 'success');
    await loadMyBookings();
    loadSessions();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Book Now';
  }
}
