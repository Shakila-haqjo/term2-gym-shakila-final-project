document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('trainer');
  if (!user) return;
  renderNav('dashboard');

  document.getElementById('welcomeName').textContent = user.name.split(' ')[0];
  await Promise.all([loadStats(), loadUpcomingSessions(), loadRecentBookings()]);
});

async function loadStats() {
  try {
    const [sessData, bookData, blogData] = await Promise.all([
      api.get('/sessions/stats'),
      api.get('/bookings'),
      apiFetch('/blogs')
    ]);

    document.getElementById('statTotal').textContent = sessData.total || 0;
    document.getElementById('statUpcoming').textContent = sessData.upcoming || 0;
    document.getElementById('statBookings').textContent = sessData.totalBookings || 0;

    const user = getUser();
    const myBlogs = (blogData.blogs || []).filter(b => b.author_id === user.id || b.author_name === user.name);
    document.getElementById('statBlogs').textContent = myBlogs.length;
  } catch (err) {
    console.error(err);
  }
}

async function loadUpcomingSessions() {
  const container = document.getElementById('upcomingSessions');
  try {
    const data = await api.get('/sessions?upcoming=true');
    const sessions = (data.sessions || []).slice(0, 5);

    if (sessions.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-times"></i><p>No upcoming sessions.<br><a href="/trainer/create-session.html" style="color:var(--accent-gold)">Create one</a></p></div>`;
      return;
    }

    container.innerHTML = sessions.map(s => `
      <div style="padding:12px 20px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:12px;">
        <div style="width:42px;height:42px;border-radius:10px;background:rgba(59,130,246,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas fa-dumbbell" style="color:var(--info);"></i>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:0.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">
            ${formatDate(s.date)} at ${formatTime(s.time)} &bull; ${s.booked_count}/${s.max_participants} booked
          </div>
        </div>
        <a href="/trainer/session-bookings.html?id=${s.id}" class="btn btn-sm btn-secondary"><i class="fas fa-users"></i></a>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger" style="margin:12px;">${err.message}</div>`;
  }
}

async function loadRecentBookings() {
  const container = document.getElementById('recentBookings');
  try {
    const data = await api.get('/bookings');
    const bookings = (data.bookings || []).filter(b => b.status === 'confirmed').slice(0, 5);

    if (bookings.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No bookings yet.</p></div>`;
      return;
    }

    container.innerHTML = bookings.map(b => `
      <div style="padding:12px 20px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--accent-gold);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.85rem;flex-shrink:0;">
          ${(b.member_name || 'U').charAt(0).toUpperCase()}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:0.875rem;">${b.member_name}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">${b.session_name} &bull; ${formatDate(b.session_date)}</div>
        </div>
        ${statusBadge(b.status)}
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger" style="margin:12px;">${err.message}</div>`;
  }
}
