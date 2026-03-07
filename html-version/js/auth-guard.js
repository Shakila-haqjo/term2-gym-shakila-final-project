// html-version/js/auth-guard.js

const AuthGuard = {
    protect: function (allowedRoles, redirectUrl = '../guest/login.html') {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token) {
            this.redirect(redirectUrl, 'Please login to continue');
            return null;
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!roles.includes(user.role)) {
            this.redirect(redirectUrl, `Access denied. This page is for ${roles.join(' or ')}s only.`);
            return null;
        }

        return { token, user };
    },

    redirect: function (url, message = null) {
        if (message) {
            alert(message);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = url;
    },

    logout: function (redirectUrl = '../guest/login.html') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = redirectUrl;
    },

    getUser: function () {
        return JSON.parse(localStorage.getItem('user') || '{}');
    },

    getToken: function () {
        return localStorage.getItem('token');
    }
};