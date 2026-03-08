// html-version/js/page-protection.js

// Page protection configurations for each role
const PageProtection = {
    // Initialize protection on page load
    init: function () {
        const currentPath = window.location.pathname;
        console.log('🔒 PageProtection.init() called');
        console.log('📍 Current path:', currentPath);

        // Guest pages - redirect if authenticated
        if (currentPath.includes('/pages/guest/')) {
            console.log('🚪 Detected GUEST page');
            this.protectGuestPage();
        }
        // Member pages
        else if (currentPath.includes('/pages/member/')) {
            console.log('👥 Detected MEMBER page');
            this.protectMemberPage();
        }
        // Trainer pages
        else if (currentPath.includes('/pages/trainer/')) {
            console.log('🏋️ Detected TRAINER page');
            this.protectTrainerPage();
        }
        // Admin pages
        else if (currentPath.includes('/pages/admin/')) {
            console.log('⚙️ Detected ADMIN page');
            this.protectAdminPage();
        }
    },

    // Protect guest pages (login, register)
    protectGuestPage: function () {
        const currentPath = window.location.pathname;

        // Allow access to index and blog pages for everyone
        if (currentPath.includes('/index.html') ||
            currentPath.includes('/blog.html') ||
            currentPath.includes('/blog-detail.html')) {
            return;
        }

        // For login/register pages, redirect if already authenticated
        RoleNavigator.preventAuthenticatedAccess();
    },

    // Protect member pages
    protectMemberPage: function () {
        console.log('👥 PageProtection.protectMemberPage() called');
        const auth = RoleNavigator.protect('member');
        if (!auth) {
            console.log('❌ Auth failed for member page');
            return;
        }

        console.log('✅ Member page protection passed');
        // Update UI with user info
        this.updateUserInfo(auth.user);
    },

    // Protect trainer pages
    protectTrainerPage: function () {
        console.log('🏋️ PageProtection.protectTrainerPage() called');
        const auth = RoleNavigator.protect('trainer');
        if (!auth) {
            console.log('❌ Auth failed for trainer page');
            return;
        }

        console.log('✅ Trainer page protection passed');
        // Update UI with user info
        this.updateUserInfo(auth.user);
    },

    // Protect admin pages
    protectAdminPage: function () {
        const auth = RoleNavigator.protect('admin');
        if (!auth) return;

        // Update UI with user info
        this.updateUserInfo(auth.user);
    },

    // Update user info in UI (name, role, etc.)
    updateUserInfo: function (user) {
        // Update user name if element exists
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = `${user.first_name} ${user.last_name}`;
        });

        // Update user role if element exists
        const userRoleElements = document.querySelectorAll('[data-user-role]');
        userRoleElements.forEach(el => {
            el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        });

        // Update user email if element exists
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });
    }
};

// Initialize protection when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    PageProtection.init();

    // Display login message if exists
    const loginMessage = sessionStorage.getItem('loginMessage');
    if (loginMessage) {
        if (typeof showToast === 'function') {
            showToast(loginMessage, 'info');
        } else {
            alert(loginMessage);
        }
        sessionStorage.removeItem('loginMessage');
    }

    // Setup logout buttons
    const logoutButtons = document.querySelectorAll('[data-logout]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            RoleNavigator.logout();
        });
    });
});