let currentTab = 'upcoming';

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('member');
  if (!user) return;
  renderNav('bookings');
  loadBookings();
});

function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadBookings();
}

async function loadBookings() {
  const tbody = document.getElementById('bookingsTable');
  tbody.innerHTML = `<tr><td colspan="7"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;

  let url = '/bookings?';
  if (currentTab === 'upcoming') url += 'upcoming=true';
  else if (currentTab === 'past') url += 'past=true';

  try {
    const data = await api.get(url);
    const bookings = data.bookings || [];

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No bookings found.<br><a href="/member/sessions.html" style="color:var(--accent-gold);">Browse sessions</a></p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      const isPast = b.session_date < new Date().toISOString().slice(0, 10);
      const canCancel = b.status === 'confirmed' && !isPast;
      return `
        <tr>
          <td>
            <div style="font-weight:600;font-size:0.875rem;">${b.session_name}</div>
          </td>
          <td>${b.activity_name || '-'}</td>
          <td>
            <div>${formatDate(b.session_date)}</div>
            <div style="font-size:0.78rem;color:var(--text-secondary);">${formatTime(b.session_time)}</div>
          </td>
          <td>${b.location_name || '-'}</td>
          <td>${b.trainer_name || '-'}</td>
          <td>${statusBadge(b.status)}</td>
          <td>
            ${canCancel
              ? `<button class="btn btn-sm btn-danger" onclick="cancelBooking(${b.id})"><i class="fas fa-times"></i> Cancel</button>`
              : `<span style="font-size:0.78rem;color:var(--text-secondary);">-</span>`
            }
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="alert alert-danger">${err.message}</div></td></tr>`;
  }
}

async function cancelBooking(id) {
  showConfirm('Cancel Booking', 'Are you sure you want to cancel this booking?', async () => {
    try {
      await api.put(`/bookings/${id}/cancel`, {});
      showToast('Booking cancelled.', 'success');
      loadBookings();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
