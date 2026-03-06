// html-version/js/main.js

// Navigation helper
function navigateTo(page) {
    window.location.href = page;
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
                'bg-blue-500'
        } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format time
function formatTime(timeString) {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Confirm dialog
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Loading state
function setLoading(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (isLoading) {
        element.disabled = true;
        element.innerHTML = '<div class="spinner mx-auto"></div>';
    } else {
        element.disabled = false;
    }
}

// Sidebar active state
function setActiveSidebarItem(currentPage) {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        if (item.getAttribute('data-page') === currentPage) {
            item.classList.add('bg-indigo-600', 'text-white');
            item.classList.remove('text-gray-700', 'hover:bg-gray-100');
        }
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    console.log('High Street Gym - Page loaded');
});