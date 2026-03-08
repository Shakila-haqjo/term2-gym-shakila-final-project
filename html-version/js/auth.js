// js/auth.js

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
    RoleNavigator.logout();
}

// Protect page - redirect if not authenticated or wrong role
function protectPage(requiredRole) {
    RoleNavigator.protect(requiredRole);
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    console.log('🔐 handleLogin() called');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('📧 Email:', email);

    try {
        console.log('📡 Sending login request to:', `${API_BASE_URL}/auth/login`);
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('📥 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (data.success) {
            console.log('✅ Login successful');
            console.log('👤 User data from API:', data.user);
            console.log('🔑 Token from API:', data.token?.substring(0, 20) + '...');
            
            // Use RoleNavigator to set session
            RoleNavigator.setSession(data.token, data.user);

            showToast('Login successful!', 'success');

            // Redirect based on role using RoleNavigator
            console.log('⏱️ Setting timeout for redirect...');
            setTimeout(() => {
                console.log('🚀 Timeout fired, calling redirectToDashboard()');
                RoleNavigator.redirectToDashboard();
            }, 1000);
        } else {
            console.log('❌ Login failed:', data.message);
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('💥 Login error:', error);
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

        // If unauthorized, redirect to login using RoleNavigator
        if (response.status === 401) {
            RoleNavigator.redirectToLogin('Session expired. Please login again.');
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