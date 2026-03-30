document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('admin');
  if (!user) return;
  renderNav('activities');
  loadActivities();
});

async function loadActivities() {
  const tbody = document.getElementById('activitiesTable');
  tbody.innerHTML = `<tr><td colspan="5"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;

  try {
    const data = await api.get('/activities');
    const activities = data.activities || [];

    if (activities.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fas fa-running"></i><p>No activities found.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = activities.map((a, i) => `
      <tr>
        <td style="color:var(--text-secondary);font-size:0.85rem;">${i + 1}</td>
        <td style="font-weight:600;">${a.name}</td>
        <td style="font-size:0.875rem;color:var(--text-secondary);max-width:300px;">${a.description || '-'}</td>
        <td>${statusBadge(a.status)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-secondary" onclick="openEditModal(${a.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteActivity(${a.id}, '${a.name}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="alert alert-danger">${err.message}</div></td></tr>`;
  }
}

function openCreateModal() {
  document.getElementById('actModalTitle').textContent = 'Add Activity';
  document.getElementById('actName').value = '';
  document.getElementById('actDescription').value = '';
  document.getElementById('actStatus').value = 'active';
  document.getElementById('editActId').value = '';
  document.getElementById('activityModal').classList.add('active');
}

async function openEditModal(id) {
  try {
    const data = await api.get('/activities');
    const act = (data.activities || []).find(a => a.id === id);
    if (!act) { showToast('Activity not found.', 'error'); return; }

    document.getElementById('actModalTitle').textContent = 'Edit Activity';
    document.getElementById('actName').value = act.name;
    document.getElementById('actDescription').value = act.description || '';
    document.getElementById('actStatus').value = act.status;
    document.getElementById('editActId').value = act.id;
    document.getElementById('activityModal').classList.add('active');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

async function saveActivity() {
  const editId = document.getElementById('editActId').value;
  const name = document.getElementById('actName').value.trim();
  if (!name) { showToast('Name is required.', 'error'); return; }

  const body = {
    name,
    description: document.getElementById('actDescription').value.trim(),
    status: document.getElementById('actStatus').value
  };

  try {
    if (editId) {
      await api.put(`/activities/${editId}`, body);
      showToast('Activity updated!', 'success');
    } else {
      await api.post('/activities', body);
      showToast('Activity created!', 'success');
    }
    closeModal('activityModal');
    loadActivities();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteActivity(id, name) {
  showConfirm('Delete Activity', `Delete "${name}"? If used in sessions, it will be deactivated instead.`, async () => {
    try {
      const data = await api.delete(`/activities/${id}`);
      showToast(data.message || 'Activity removed.', 'success');
      loadActivities();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
