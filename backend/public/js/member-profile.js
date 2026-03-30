document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('member');
  if (!user) return;
  renderNav('profile');
  loadProfile();
});

async function loadProfile() {
  try {
    const data = await api.get('/auth/me');
    const user = data.user;
    fillProfile(user);
  } catch (err) {
    showToast('Failed to load profile: ' + err.message, 'error');
  }
}

function fillProfile(user) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('avatarCircle').textContent = initials;
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileRole').innerHTML = statusBadge(user.role);
  document.getElementById('profileEmail').innerHTML = `<i class="fas fa-envelope" style="width:16px;color:var(--accent-gold)"></i> ${user.email}`;
  document.getElementById('profilePhone').innerHTML = user.phone ? `<i class="fas fa-phone" style="width:16px;color:var(--accent-gold)"></i> ${user.phone}` : '';
  document.getElementById('profileAddress').innerHTML = user.address ? `<i class="fas fa-map-marker-alt" style="width:16px;color:var(--accent-gold)"></i> ${user.address}` : '';

  document.getElementById('name').value = user.name;
  document.getElementById('email').value = user.email;
  document.getElementById('phone').value = user.phone || '';
  document.getElementById('address').value = user.address || '';
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById('alertBox');
  alertBox.innerHTML = '';

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();

  if (!name) {
    alertBox.innerHTML = `<div class="alert alert-danger">Name is required.</div>`;
    return;
  }

  try {
    const data = await api.put('/auth/me', { name, phone, address });
    saveAuth(getToken(), data.user);
    fillProfile(data.user);
    alertBox.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle"></i> Profile updated successfully!</div>`;
    showToast('Profile updated!', 'success');
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
});

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById('alertBox');
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!newPassword) {
    alertBox.innerHTML = `<div class="alert alert-danger">Please enter a new password.</div>`;
    return;
  }
  if (newPassword.length < 6) {
    alertBox.innerHTML = `<div class="alert alert-danger">Password must be at least 6 characters.</div>`;
    return;
  }
  if (newPassword !== confirmPassword) {
    alertBox.innerHTML = `<div class="alert alert-danger">Passwords do not match.</div>`;
    return;
  }

  try {
    await api.put('/auth/me', { password: newPassword });
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    alertBox.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle"></i> Password updated successfully!</div>`;
    showToast('Password updated!', 'success');
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
});
