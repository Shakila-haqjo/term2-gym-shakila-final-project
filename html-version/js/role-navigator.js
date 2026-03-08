// html-version/js/role-navigator.js

const RoleNavigator = {
    // Role-based dashboard routes
    dashboardRoutes: {
        guest: '/pages/guest/index.html',
        member: '/pages/member/dashboard.html',
        trainer: '/pages/trainer/dashboard.html',
        admin: '/pages/admin/dashboard.html'
    },

    // Check authentication and redirect to appropriate dashboard
    redirectToDashboard: function () {
        console.log('🔄 RoleNavigator.redirectToDashboard() called');
        const user = this.getUser();
        const token = this.getToken();
        
        console.log('📋 User from localStorage:', user);
        console.log('🔑 Token exists:', !!token);
        console.log('👤 User role:', user?.role);

        if (!token || !user || !user.role) {
            console.log('❌ No valid auth, redirecting to guest');
            window.location.href = this.dashboardRoutes.guest;
            return;
        }

        const route = this.dashboardRoutes[user.role];
        console.log('🎯 Target route for role', user.role, ':', route);
        if (route) {
            console.log('✅ Redirecting to:', route);
            window.location.href = route;
        } else {
            console.log('⚠️ No route found for role, redirecting to guest');
            window.location.href = this.dashboardRoutes.guest;
        }
    },

    // Protect page based on allowed roles
    protect: function (allowedRoles) {
        console.log('🛡️ RoleNavigator.protect() called with roles:', allowedRoles);
        const token = this.getToken();
        const user = this.getUser();
        
        console.log('📋 Current user:', user);
        console.log('🔑 Token exists:', !!token);

        // No token - redirect to login
        if (!token) {
            console.log('❌ No token found, redirecting to login');
            this.redirectToLogin('Please login to continue');
            return null;
        }

        // No user data - clear session and redirect
        if (!user || !user.role) {
            console.log('❌ No user or role, clearing session');
            this.clearSession();
            this.redirectToLogin('Invalid session. Please login again.');
            return null;
        }

        // Convert single role to array
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        console.log('✅ Allowed roles:', roles);
        console.log('👤 User role:', user.role);

        // Check if user role is allowed
        if (!roles.includes(user.role)) {
            console.log('⚠️ User role not allowed on this page, redirecting to correct dashboard');
            this.redirectToDashboard();
            return null;
        }

        console.log('✅ Access granted');
        return { token, user };
    },

    // Redirect guest to login if they try to access protected pages
    preventAuthenticatedAccess: function () {
        const token = this.getToken();
        const user = this.getUser();

        if (token && user && user.role) {
            this.redirectToDashboard();
        }
    },

    // Clear session
    clearSession: function () {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Redirect to login with message
    redirectToLogin: function (message = null) {
        if (message) {
            sessionStorage.setItem('loginMessage', message);
        }
        this.clearSession();
        window.location.href = '/pages/guest/login.html';
    },

    // Logout user
    logout: function () {
        this.clearSession();
        sessionStorage.setItem('loginMessage', 'You have been logged out successfully');
        window.location.href = '/pages/guest/login.html';
    },

    // Get user from localStorage
    getUser: function () {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    },

    // Get token from localStorage
    getToken: function () {
        return localStorage.getItem('token');
    },

    // Set user session after login
    setSession: function (token, user) {
        console.log('💾 RoleNavigator.setSession() called');
        console.log('🔑 Token:', token?.substring(0, 20) + '...');
        console.log('👤 User data:', user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Session saved to localStorage');
    },

    // Check if user is authenticated
    isAuthenticated: function () {
        return !!(this.getToken() && this.getUser());
    },

    // Get user role
    getUserRole: function () {
        const user = this.getUser();
        return user ? user.role : null;
    },

    // Check if user has specific role
    hasRole: function (role) {
        return this.getUserRole() === role;
    }
};