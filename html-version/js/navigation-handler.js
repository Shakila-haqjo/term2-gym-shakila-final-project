// html-version/js/navigation-handler.js

const NavigationHandler = {
    // Navigation menu configurations for each role
    navigationMenus: {
        member: [
            { name: 'Dashboard', url: '/pages/member/dashboard.html', icon: 'dashboard' },
            { name: 'Sessions', url: '/pages/member/sessions.html', icon: 'calendar' },
            { name: 'Book Session', url: '/pages/member/book-session.html', icon: 'book' },
            { name: 'My Bookings', url: '/pages/member/bookings.html', icon: 'list' },
            { name: 'Blog', url: '/pages/member/create-blog.html', icon: 'edit' },
            { name: 'Profile', url: '/pages/member/profile.html', icon: 'user' }
        ],
        trainer: [
            { name: 'Dashboard', url: '/pages/trainer/dashboard.html', icon: 'dashboard' },
            { name: 'My Sessions', url: '/pages/trainer/sessions.html', icon: 'calendar' },
            { name: 'Create Session', url: '/pages/trainer/create-session.html', icon: 'plus' },
            { name: 'Bookings', url: '/pages/trainer/session-bookings.html', icon: 'list' },
            { name: 'Blog', url: '/pages/trainer/blog.html', icon: 'edit' },
            { name: 'Profile', url: '/pages/trainer/profile.html', icon: 'user' }
        ],
        admin: [
            { name: 'Dashboard', url: '/pages/admin/dashboard.html', icon: 'dashboard' },
            { name: 'Users', url: '/pages/admin/users.html', icon: 'users' },
            { name: 'Sessions', url: '/pages/admin/sessions.html', icon: 'calendar' },
            { name: 'Bookings', url: '/pages/admin/bookings.html', icon: 'list' },
            { name: 'Activities', url: '/pages/admin/activities.html', icon: 'activity' },
            { name: 'Locations', url: '/pages/admin/locations.html', icon: 'location' },
            { name: 'Blog', url: '/pages/admin/blog.html', icon: 'edit' }
        ]
    },

    // Get navigation menu for current user role
    getNavigationMenu: function () {
        const role = RoleNavigator.getUserRole();
        return this.navigationMenus[role] || [];
    },

    // Render navigation menu
    renderNavigationMenu: function (containerId = 'nav-menu') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const menu = this.getNavigationMenu();
        const currentPath = window.location.pathname;

        let html = '';
        menu.forEach(item => {
            const isActive = currentPath.includes(item.url);
            const activeClass = isActive ? 'active' : '';

            html += `
                <a href="${item.url}" class="nav-item ${activeClass}">
                    <span class="nav-icon">${this.getIcon(item.icon)}</span>
                    <span class="nav-text">${item.name}</span>
                </a>
            `;
        });

        container.innerHTML = html;
    },

    // Get icon HTML
    getIcon: function (iconName) {
        const icons = {
            dashboard: '📊',
            calendar: '📅',
            book: '📖',
            list: '📋',
            edit: '✍️',
            user: '👤',
            users: '👥',
            plus: '➕',
            activity: '🏃',
            location: '📍'
        };
        return icons[iconName] || '•';
    },

    // Check if navigation should be displayed
    shouldShowNavigation: function () {
        const currentPath = window.location.pathname;

        // Don't show navigation on guest pages
        if (currentPath.includes('/pages/guest/')) {
            return false;
        }

        return RoleNavigator.isAuthenticated();
    }
};

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', function () {
    if (NavigationHandler.shouldShowNavigation()) {
        NavigationHandler.renderNavigationMenu();
    }
});