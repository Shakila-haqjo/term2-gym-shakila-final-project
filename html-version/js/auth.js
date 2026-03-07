// html-version/js/auth.js
const API_BASE_URL = 'http://localhost:3000/api';

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Set token in localStorage
function setToken(token) {
    localStorage.setItem('token', token);
}

// Remove token
function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Get user from localStorage
function getUserSession() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Set user session
function setUserSession(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Check if user is logged in
function isLoggedIn() {
    return !!getToken();
}

// Get user role
function getUserRole() {
    const user = getUserSession();
    return user ? user.role : null;
}

// Logout
function logout() {
    removeToken();
    window.location.href = '/pages/guest/login.html';
}

// Protect page - redirect if not authenticated or wrong role
function protectPage(requiredRole) {
    if (!isLoggedIn()) {
        window.location.href = '/pages/guest/login.html';
        return;
    }

    const userRole = getUserRole();
    if (requiredRole && userRole !== requiredRole) {
        window.location.href = '/pages/guest/login.html';
        return;
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            setToken(data.token);
            setUserSession(data.user);

            showToast('Login successful!', 'success');

            // Redirect based on role
            const role = data.user.role;
            setTimeout(() => {
                if (role === 'admin') {
                    window.location.href = '/pages/admin/dashboard.html';
                } else if (role === 'trainer') {
                    window.location.href = '/pages/trainer/dashboard.html';
                } else {
                    window.location.href = '/pages/member/dashboard.html';
                }
            }, 1000);
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please check your connection.', 'error');
    }
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                phone,
                password,
                role: 'member'
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Registration successful! Please login.', 'success');
            setTimeout(() => {
                window.location.href = '/pages/guest/login.html';
            }, 1500);
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Registration failed. Please try again.', 'error');
    }
}

// Handle password reset
async function handlePasswordReset(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;

    // TODO: Implement password reset API endpoint
    showToast('Password reset link sent to your email', 'success');
    setTimeout(() => {
        window.location.href = '/pages/guest/login.html';
    }, 2000);
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
        const data = await response.json();

        // If unauthorized, redirect to login
        if (response.status === 401) {
            removeToken();
            window.location.href = '/pages/guest/login.html';
            return null;
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Get current user from API
async function getCurrentUser() {
    return await apiRequest('/auth/me');
}