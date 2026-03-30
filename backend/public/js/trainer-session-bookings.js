document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('trainer');
  if (!user) return;
  renderNav('sessions');

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    showToast('No session ID specified.', 'error');
    setTimeout(() => window.location.href = '/trainer/sessions', 1500);
    return;
  }

  await loadSessionBookings(id);
});

async function loadSessionBookings(id) {
  const sessionInfo = document.getElementById('sessionInfo');
  const tbody = document.getElementById('bookingsTable');

  try {
    const data = await api.get(`/sessions/${id}/bookings`);
    const { bookings, session } = data;

    // Session info card
    sessionInfo.innerHTML = `
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
          <div style="background:linear-gradient(135deg,#1e2537,#2d3748);border-radius:12px;padding:14px 20px;color:white;min-width:200px;">
            <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:4px;">${session.activity_name || 'General'}</div>
            <div style="font-size:1.05rem;font-weight:700;">${session.name}</div>
          </div>
          <div style="display:flex;gap:20px;flex-wrap:wrap;">
            <div class="session-meta-item"><i class="fas fa-calendar"></i> ${formatDate(session.date)}</div>
            <div class="session-meta-item"><i class="fas fa-clock"></i> ${formatTime(session.time)} (${session.duration_minutes} min)</div>
            <div class="session-meta-item"><i class="fas fa-map-marker-alt"></i> ${session.location_name || 'TBD'}</div>
            <div class="session-meta-item"><i class="fas fa-users"></i> ${session.booked_count}/${session.max_participants} spots</div>
          </div>
          <a href="/trainer/sessions" class="btn btn-sm btn-secondary" style="margin-left:auto;"><i class="fas fa-arrow-left"></i> Back</a>
        </div>
      </div>
    `;

    const confirmed = bookings.filter(b => b.status === 'confirmed');
    document.getElementById('bookingCount').textContent = `${confirmed.length} confirmed`;

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-users"></i><p>No bookings yet for this session.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = bookings.map((b, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-gold);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.8rem;flex-shrink:0;">
              ${(b.member_name || 'U').charAt(0).toUpperCase()}
            </div>
            <span style="font-weight:500;">${b.member_name}</span>
          </div>
        </td>
        <td>${b.member_email}</td>
        <td>${b.member_phone || '-'}</td>
        <td>${statusBadge(b.status)}</td>
        <td style="font-size:0.82rem;color:var(--text-secondary);">${formatDateTime(b.created_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    sessionInfo.innerHTML = `<div class="card-body"><div class="alert alert-danger">${err.message}</div></div>`;
    tbody.innerHTML = '';
  }
}
