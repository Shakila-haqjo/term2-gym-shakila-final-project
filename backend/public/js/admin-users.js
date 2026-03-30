document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('admin');
  if (!user) return;
  renderNav('users');
  loadUsers();

  let timer;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(loadUsers, 400);
  });
  document.getElementById('roleFilter').addEventListener('change', loadUsers);
  document.getElementById('statusFilter').addEventListener('change', loadUsers);
});

async function loadUsers() {
  const tbody = document.getElementById('usersTable');
  const search = document.getElementById('searchInput').value.trim();
  const role = document.getElementById('roleFilter').value;
  const status = document.getElementById('statusFilter').value;

  let url = '/users?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (role) url += `role=${role}&`;
  if (status) url += `status=${status}`;

  tbody.innerHTML = `<tr><td colspan="7"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;

  try {
    const data = await api.get(url);
    const users = data.users || [];

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-users"></i><p>No users found.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--accent-gold);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.85rem;flex-shrink:0;">
              ${u.name.charAt(0).toUpperCase()}
            </div>
            <span style="font-weight:500;">${u.name}</span>
          </div>
        </td>
        <td style="font-size:0.875rem;">${u.email}</td>
        <td style="font-size:0.875rem;">${u.phone || '-'}</td>
        <td>${statusBadge(u.role)}</td>
        <td>${statusBadge(u.status)}</td>
        <td style="font-size:0.82rem;color:var(--text-secondary);">${formatDate(u.created_at)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-secondary" onclick="openEditModal(${u.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deactivateUser(${u.id}, '${u.name}')"><i class="fas fa-user-slash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="alert alert-danger">${err.message}</div></td></tr>`;
  }
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('roleFilter').value = '';
  document.getElementById('statusFilter').value = '';
  loadUsers();
}

function openCreateModal() {
  document.getElementById('userModalTitle').textContent = 'Add User';
  document.getElementById('uName').value = '';
  document.getElementById('uEmail').value = '';
  document.getElementById('uPassword').value = '';
  document.getElementById('uPhone').value = '';
  document.getElementById('uRole').value = 'member';
  document.getElementById('uStatus').value = 'active';
  document.getElementById('uAddress').value = '';
  document.getElementById('editUserId').value = '';
  document.getElementById('passHint').textContent = '(required for new)';
  document.getElementById('userModal').classList.add('active');
}

async function openEditModal(id) {
  try {
    const data = await api.get(`/users/${id}`);
    const u = data.user;
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('uName').value = u.name;
    document.getElementById('uEmail').value = u.email;
    document.getElementById('uPassword').value = '';
    document.getElementById('uPhone').value = u.phone || '';
    document.getElementById('uRole').value = u.role;
    document.getElementById('uStatus').value = u.status;
    document.getElementById('uAddress').value = u.address || '';
    document.getElementById('editUserId').value = u.id;
    document.getElementById('passHint').textContent = '(leave blank to keep)';
    document.getElementById('userModal').classList.add('active');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

async function saveUser() {
  const editId = document.getElementById('editUserId').value;
  const name = document.getElementById('uName').value.trim();
  const email = document.getElementById('uEmail').value.trim();
  const password = document.getElementById('uPassword').value;

  if (!name || !email) {
    showToast('Name and email are required.', 'error');
    return;
  }
  if (!editId && !password) {
    showToast('Password is required for new users.', 'error');
    return;
  }

  const body = {
    name, email,
    phone: document.getElementById('uPhone').value.trim(),
    role: document.getElementById('uRole').value,
    status: document.getElementById('uStatus').value,
    address: document.getElementById('uAddress').value.trim(),
  };
  if (password) body.password = password;

  try {
    if (editId) {
      await api.put(`/users/${editId}`, body);
      showToast('User updated!', 'success');
    } else {
      await api.post('/users', body);
      showToast('User created!', 'success');
    }
    closeModal('userModal');
    loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deactivateUser(id, name) {
  showConfirm('Deactivate User', `Are you sure you want to deactivate "${name}"?`, async () => {
    try {
      await api.delete(`/users/${id}`);
      showToast('User deactivated.', 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
