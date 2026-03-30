document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('admin');
  if (!user) return;
  renderNav('dashboard');

  document.getElementById('headerDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  await Promise.all([loadStats(), loadRecentBookings()]);
});

async function loadStats() {
  try {
    const [userStats, sessStats, bookingStats, blogData] = await Promise.all([
      api.get('/users/stats'),
      api.get('/sessions/stats'),
      api.get('/bookings/stats'),
      apiFetch('/blogs')
    ]);

    document.getElementById('statUsers').textContent = userStats.total || 0;
    document.getElementById('statSessions').textContent = sessStats.total || 0;
    document.getElementById('statBookings').textContent = bookingStats.total || 0;
    document.getElementById('statBlogs').textContent = (blogData.blogs || []).length;

    document.getElementById('statMembers').textContent = userStats.members || 0;
    document.getElementById('statTrainers').textContent = userStats.trainers || 0;
    document.getElementById('statConfirmed').textContent = bookingStats.confirmed || 0;
    document.getElementById('statCancelled').textContent = bookingStats.cancelled || 0;

    renderChart(bookingStats.trend || []);
  } catch (err) {
    console.error('Stats error:', err);
  }
}

function renderChart(trend) {
  const ctx = document.getElementById('bookingsChart');
  if (!ctx) return;

  // Fill in last 7 days with 0 if missing
  const days = [];
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = trend.find(t => t.day === dateStr);
    days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    counts.push(found ? found.cnt : 0);
  }

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Bookings',
        data: counts,
        backgroundColor: 'rgba(245,158,11,0.6)',
        borderColor: 'rgba(245,158,11,1)',
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.raw} bookings` } }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

async function loadRecentBookings() {
  const tbody = document.getElementById('recentBookings');
  try {
    const data = await api.get('/bookings');
    const bookings = (data.bookings || []).slice(0, 8);

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No bookings yet.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--accent-gold);display:flex;align-items:center;justify-content:center;color:white;font-size:0.78rem;font-weight:700;flex-shrink:0;">
              ${(b.member_name || 'U').charAt(0).toUpperCase()}
            </div>
            <span style="font-size:0.875rem;font-weight:500;">${b.member_name}</span>
          </div>
        </td>
        <td style="font-size:0.875rem;">${b.session_name}</td>
        <td style="font-size:0.875rem;">${formatDate(b.session_date)}</td>
        <td>${statusBadge(b.status)}</td>
        <td style="font-size:0.78rem;color:var(--text-secondary);">${formatDateTime(b.created_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="alert alert-danger">${err.message}</div></td></tr>`;
  }
}
