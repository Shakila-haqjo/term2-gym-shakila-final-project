function getUser() {
  return JSON.parse(localStorage.getItem('user') || 'null');
}

function getToken() {
  return localStorage.getItem('token');
}

function requireAuth(role) {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = '/login';
    return null;
  }
  if (role && user.role !== role) {
    // Redirect to appropriate dashboard
    if (user.role === 'admin') window.location.href = '/admin/dashboard';
    else if (user.role === 'trainer') window.location.href = '/trainer/dashboard';
    else window.location.href = '/member/dashboard';
    return null;
  }
  return user;
}

function requireAnyAuth() {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = '/login';
    return null;
  }
  return user;
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
  } catch (e) { /* ignore network errors */ }
  localStorage.clear();
  window.location.href = '/';
}

function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function getDashboardUrl(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'trainer') return '/trainer/dashboard';
  return '/member/dashboard';
}

// Redirect logged-in users away from auth pages
function redirectIfLoggedIn() {
  const user = getUser();
  const token = getToken();
  if (user && token) {
    window.location.href = getDashboardUrl(user.role);
  }
}
