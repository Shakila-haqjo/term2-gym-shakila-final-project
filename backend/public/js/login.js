document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();

  // Pre-fill from URL params (role redirect)
  const params = new URLSearchParams(window.location.search);
  if (params.get('registered')) {
    document.getElementById('alertBox').innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle"></i> Account created! Please sign in.</div>`;
  }
});

function fillCreds(email, password) {
  document.getElementById('email').value = email;
  document.getElementById('password').value = password;
}

function togglePass() {
  const input = document.getElementById('password');
  const icon = document.getElementById('eyeIcon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const alertBox = document.getElementById('alertBox');
  alertBox.innerHTML = '';
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';

  try {
    const data = await api.post('/auth/login', {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    });

    saveAuth(data.token, data.user);

    alertBox.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle"></i> Login successful! Redirecting...</div>`;

    setTimeout(() => {
      window.location.href = getDashboardUrl(data.user.role);
    }, 800);
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
  }
});
