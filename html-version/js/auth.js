// html-version/js/auth.js

// Store user session in localStorage
function setUserSession(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Get user session
function getUserSession() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Check if user is logged in
function isLoggedIn() {
    return getUserSession() !== null;
}

// Get user role
function getUserRole() {
    const user = getUserSession();
    return user ? user.role : 'guest';
}

// Logout
function logout() {
    localStorage.removeItem('user');
    navigateTo('../guest/index.html');
}

// Protect page - redirect if not authenticated
function protectPage(requiredRole = null) {
    if (!isLoggedIn()) {
        navigateTo('../guest/login.html');
        return;
    }

    if (requiredRole) {
        const userRole = getUserRole();
        if (userRole !== requiredRole) {
            navigateTo(`../${userRole}/dashboard.html`);
        }
    }
}

// Handle login
function handleLogin(email, password, role) {
    // Simulate login (replace with actual API call)
    const user = {
        id: Date.now(),
        email: email,
        name: email.split('@')[0],
        role: role,
        isLoggedIn: true
    };

    setUserSession(user);

    // Navigate to appropriate dashboard
    const dashboard = role === 'admin' ? 'admin' :
        role === 'trainer' ? 'trainer' :
            'member';
    navigateTo(`../${dashboard}/dashboard.html`);
}

// Handle registration
function handleRegister(formData) {
    // Simulate registration (replace with actual API call)
    showToast('Registration successful! Please login.', 'success');
    setTimeout(() => {
        navigateTo('login.html');
    }, 1500);
}

// Handle password reset
function handlePasswordReset(email) {
    // Simulate password reset (replace with actual API call)
    showToast('Password reset link sent to your email!', 'success');
    setTimeout(() => {
        navigateTo('login.html');
    }, 2000);
}