document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();
});

document.getElementById('adminRegisterForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById('alertBox');
  const btn = document.getElementById('submitBtn');
  alertBox.innerHTML = '';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();

  if (!name || !email || !password) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Please fill in all required fields.</div>`;
    return;
  }

  if (password.length < 6) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Password must be at least 6 characters.</div>`;
    return;
  }

  if (password !== confirmPassword) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Passwords do not match.</div>`;
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Admin Account...';

  try {
    const data = await api.post('/auth/register', { name, email, password, role: 'admin', phone, address });

    saveAuth(data.token, data.user);

    alertBox.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle"></i> Admin account created! Redirecting to dashboard...</div>`;

    setTimeout(() => {
      window.location.href = '/admin/dashboard.html';
    }, 1000);
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-shield"></i> Register as Admin';
  }
});
