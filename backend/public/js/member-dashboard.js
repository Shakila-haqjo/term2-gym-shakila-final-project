document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('member');
  if (!user) return;

  renderNav('dashboard');

  document.getElementById('welcomeName').textContent = user.name.split(' ')[0];
  document.getElementById('headerDate').textContent = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  await Promise.all([loadStats(), loadLatestBlogs()]);
});

async function loadStats() {
  try {
    const data = await api.get('/bookings?upcoming=true');
    const all = await api.get('/bookings');
    const bookings = all.bookings || [];
    const upcoming = (data.bookings || []).filter(b => b.status === 'confirmed');
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;

    document.getElementById('statTotal').textContent = bookings.length;
    document.getElementById('statUpcoming').textContent = upcoming.length;
    document.getElementById('statConfirmed').textContent = confirmed;
    document.getElementById('statCancelled').textContent = cancelled;
  } catch (err) {
    console.error(err);
  }
}

async function loadUpcomingBookings() {
  const container = document.getElementById('upcomingBookings');
  try {
    const data = await api.get('/bookings?upcoming=true');
    const bookings = (data.bookings || []).filter(b => b.status === 'confirmed').slice(0, 5);

    if (bookings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-times"></i>
          <p>No upcoming sessions.<br><a href="/member/sessions" style="color:var(--accent-gold)">Book one now!</a></p>
        </div>`;
      return;
    }

    container.innerHTML = bookings.map(b => `
      <div style="padding:12px 20px; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:12px;">
        <div style="width:42px;height:42px;border-radius:10px;background:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas fa-calendar-check" style="color:var(--accent-gold);"></i>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600; font-size:0.875rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.session_name}</div>
          <div style="font-size:0.78rem; color:var(--text-secondary);">
            ${formatDate(b.session_date)} at ${formatTime(b.session_time)}
            ${b.location_name ? '&bull; ' + b.location_name : ''}
          </div>
        </div>
        ${statusBadge(b.status)}
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger" style="margin:12px;">${err.message}</div>`;
  }
}

async function loadLatestBlogs() {
  const container = document.getElementById('latestBlogs');
  try {
    const data = await apiFetch('/blogs?status=published');
    const blogs = (data.blogs || []).slice(0, 4);

    if (blogs.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-newspaper"></i><p>No posts yet.</p></div>`;
      return;
    }

    container.innerHTML = blogs.map(b => `
      <div style="padding:10px 20px; border-bottom:1px solid var(--border-color);">
        <a href="/blog-detail?id=${b.id}" style="text-decoration:none;">
          <div style="font-size:0.875rem; font-weight:500; color:var(--text-primary); margin-bottom:2px;">${b.title}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">
            ${b.author_name} &bull; ${formatDate(b.created_at)}
          </div>
        </a>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger" style="margin:12px;">${err.message}</div>`;
  }
}
