document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('admin');
  if (!user) return;
  renderNav('locations');
  loadLocations();
});

async function loadLocations() {
  const tbody = document.getElementById('locationsTable');
  tbody.innerHTML = `<tr><td colspan="6"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;

  try {
    const data = await api.get('/locations');
    const locations = data.locations || [];

    if (locations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-map-marker-alt"></i><p>No locations found.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = locations.map((l, i) => `
      <tr>
        <td style="color:var(--text-secondary);font-size:0.85rem;">${i + 1}</td>
        <td style="font-weight:600;">${l.name}</td>
        <td style="font-size:0.875rem;color:var(--text-secondary);">${l.address || '-'}</td>
        <td>
          <span style="display:flex;align-items:center;gap:4px;font-size:0.875rem;">
            <i class="fas fa-users" style="color:var(--accent-gold);"></i> ${l.capacity}
          </span>
        </td>
        <td>${statusBadge(l.status)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-secondary" onclick="openEditModal(${l.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteLocation(${l.id}, '${l.name}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="alert alert-danger">${err.message}</div></td></tr>`;
  }
}

function openCreateModal() {
  document.getElementById('locModalTitle').textContent = 'Add Location';
  document.getElementById('locName').value = '';
  document.getElementById('locAddress').value = '';
  document.getElementById('locCapacity').value = '20';
  document.getElementById('locStatus').value = 'active';
  document.getElementById('editLocId').value = '';
  document.getElementById('locationModal').classList.add('active');
}

async function openEditModal(id) {
  try {
    const data = await api.get('/locations');
    const loc = (data.locations || []).find(l => l.id === id);
    if (!loc) { showToast('Location not found.', 'error'); return; }

    document.getElementById('locModalTitle').textContent = 'Edit Location';
    document.getElementById('locName').value = loc.name;
    document.getElementById('locAddress').value = loc.address || '';
    document.getElementById('locCapacity').value = loc.capacity;
    document.getElementById('locStatus').value = loc.status;
    document.getElementById('editLocId').value = loc.id;
    document.getElementById('locationModal').classList.add('active');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

async function saveLocation() {
  const editId = document.getElementById('editLocId').value;
  const name = document.getElementById('locName').value.trim();
  if (!name) { showToast('Name is required.', 'error'); return; }

  const body = {
    name,
    address: document.getElementById('locAddress').value.trim(),
    capacity: parseInt(document.getElementById('locCapacity').value) || 20,
    status: document.getElementById('locStatus').value
  };

  try {
    if (editId) {
      await api.put(`/locations/${editId}`, body);
      showToast('Location updated!', 'success');
    } else {
      await api.post('/locations', body);
      showToast('Location created!', 'success');
    }
    closeModal('locationModal');
    loadLocations();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteLocation(id, name) {
  showConfirm('Delete Location', `Delete "${name}"? If used in sessions, it will be deactivated instead.`, async () => {
    try {
      const data = await api.delete(`/locations/${id}`);
      showToast(data.message || 'Location removed.', 'success');
      loadLocations();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
