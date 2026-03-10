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
    window.location.href = '/login.html';
    return null;
  }
  if (role && user.role !== role) {
    // Redirect to appropriate dashboard
    if (user.role === 'admin') window.location.href = '/admin/dashboard.html';
    else if (user.role === 'trainer') window.location.href = '/trainer/dashboard.html';
    else window.location.href = '/member/dashboard.html';
    return null;
  }
  return user;
}

function requireAnyAuth() {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

function logout() {
  localStorage.clear();
  window.location.href = '/login.html';
}

function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function getDashboardUrl(role) {
  if (role === 'admin') return '/admin/dashboard.html';
  if (role === 'trainer') return '/trainer/dashboard.html';
  return '/member/dashboard.html';
}

// Redirect logged-in users away from auth pages
function redirectIfLoggedIn() {
  const user = getUser();
  const token = getToken();
  if (user && token) {
    window.location.href = getDashboardUrl(user.role);
  }
}
