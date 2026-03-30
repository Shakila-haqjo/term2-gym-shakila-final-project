document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();

  // Pre-select role from URL param
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role');
  if (role === 'trainer') {
    document.querySelector('input[value="trainer"]').checked = true;
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById('alertBox');
  const btn = document.getElementById('submitBtn');
  alertBox.innerHTML = '';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const role = document.querySelector('input[name="role"]:checked').value;
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
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

  try {
    const data = await api.post('/auth/register', { name, email, password, role, phone, address });

    saveAuth(data.token, data.user);

    alertBox.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle"></i> Account created! Redirecting to your dashboard...</div>`;

    setTimeout(() => {
      window.location.href = getDashboardUrl(data.user.role);
    }, 1000);
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
  }
});
