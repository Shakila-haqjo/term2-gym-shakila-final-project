document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('admin');
  if (!user) return;
  renderNav('bookings');
  loadStats();
  loadBookings();
  await Promise.all([loadMembersDropdown(), loadSessionsDropdown()]);

  document.getElementById('statusFilter').addEventListener('change', loadBookings);
  document.getElementById('timeFilter').addEventListener('change', loadBookings);
});

async function loadStats() {
  try {
    const data = await api.get('/bookings/stats');
    document.getElementById('statTotal').textContent = data.total || 0;
    document.getElementById('statConfirmed').textContent = data.confirmed || 0;
    document.getElementById('statCancelled').textContent = data.cancelled || 0;
    document.getElementById('statCompleted').textContent = data.completed || 0;
  } catch (err) { console.error(err); }
}

function clearFilters() {
  document.getElementById('statusFilter').value = '';
  document.getElementById('timeFilter').value = '';
  loadBookings();
}

async function loadBookings() {
  const tbody = document.getElementById('bookingsTable');
  const status = document.getElementById('statusFilter').value;
  const time = document.getElementById('timeFilter').value;

  let url = '/bookings?';
  if (status) url += `status=${status}&`;
  if (time === 'upcoming') url += 'upcoming=true';
  else if (time === 'past') url += 'past=true';

  tbody.innerHTML = `<tr><td colspan="8"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;

  try {
    const data = await api.get(url);
    const bookings = data.bookings || [];

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No bookings found.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--accent-gold);display:flex;align-items:center;justify-content:center;color:white;font-size:0.78rem;font-weight:700;flex-shrink:0;">
              ${(b.member_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight:500;font-size:0.875rem;">${b.member_name}</div>
              <div style="font-size:0.75rem;color:var(--text-secondary);">${b.member_email}</div>
            </div>
          </div>
        </td>
        <td style="font-size:0.875rem;font-weight:500;">${b.session_name}</td>
        <td style="font-size:0.875rem;">${b.activity_name || '-'}</td>
        <td>
          <div style="font-size:0.875rem;">${formatDate(b.session_date)}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">${formatTime(b.session_time)}</div>
        </td>
        <td style="font-size:0.875rem;">${b.trainer_name || '-'}</td>
        <td>${statusBadge(b.status)}</td>
        <td style="font-size:0.78rem;color:var(--text-secondary);">${formatDate(b.created_at)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            ${b.status === 'confirmed'
              ? `<button class="btn btn-sm btn-warning" onclick="cancelBooking(${b.id})" style="background:rgba(245,158,11,0.1);color:var(--warning);border:1px solid rgba(245,158,11,0.3);">
                  <i class="fas fa-ban"></i> Cancel
                </button>`
              : ''
            }
            <button class="btn btn-sm btn-danger" onclick="deleteBooking(${b.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="alert alert-danger">${err.message}</div></td></tr>`;
  }
}

async function loadMembersDropdown() {
  try {
    const data = await api.get('/users?role=member');
    const sel = document.getElementById('cbMember');
    (data.users || []).forEach(u => {
      sel.innerHTML += `<option value="${u.id}">${u.name} (${u.email})</option>`;
    });
  } catch (e) {}
}

async function loadSessionsDropdown() {
  try {
    const data = await api.get('/sessions?upcoming=true');
    const sel = document.getElementById('cbSession');
    (data.sessions || []).forEach(s => {
      sel.innerHTML += `<option value="${s.id}">${s.name} — ${s.date} ${s.time}</option>`;
    });
  } catch (e) {}
}

function openCreateModal() {
  document.getElementById('cbMember').value = '';
  document.getElementById('cbSession').value = '';
  document.getElementById('createBookingModal').classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

async function saveBooking() {
  const user_id = document.getElementById('cbMember').value;
  const session_id = document.getElementById('cbSession').value;
  if (!user_id || !session_id) { showToast('Select a member and a session.', 'error'); return; }

  try {
    await api.post('/bookings/admin-create', { user_id: parseInt(user_id), session_id: parseInt(session_id) });
    showToast('Booking created!', 'success');
    closeModal('createBookingModal');
    loadBookings();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function cancelBooking(id) {
  showConfirm('Cancel Booking', 'Cancel this booking?', async () => {
    try {
      await api.put(`/bookings/${id}/cancel`, {});
      showToast('Booking cancelled.', 'success');
      loadBookings();
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function deleteBooking(id) {
  showConfirm('Delete Booking', 'Permanently delete this booking?', async () => {
    try {
      await api.delete(`/bookings/${id}`);
      showToast('Booking deleted.', 'success');
      loadBookings();
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
