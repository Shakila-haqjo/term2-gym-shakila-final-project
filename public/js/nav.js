/**
 * nav.js - Renders sidebar navigation based on user role
 * Call renderNav() after DOM load on any authenticated page
 */

function renderNav(activePage) {
  // If sidebar already rendered server-side by EJS layout, just wire up hamburger
  if (document.getElementById('sidebar')) {
    const hamburger = document.getElementById('hamburgerBtn');
    if (hamburger) hamburger.addEventListener('click', toggleSidebar);
    return;
  }

  const user = getUser();
  if (!user) return;

  const memberLinks = [
    { href: '/member/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard', key: 'dashboard' },
    { href: '/member/sessions',  icon: 'fa-calendar-alt',   label: 'Timetable',  key: 'sessions' },
    { href: '/blog',             icon: 'fa-newspaper',      label: 'Blog',        key: 'blog' },
    { href: '/member/bookings',  icon: 'fa-ticket-alt',     label: 'My Bookings', key: 'bookings' },
  ];

  const trainerLinks = [
    { href: '/trainer/dashboard',       icon: 'fa-tachometer-alt', label: 'Dashboard',       key: 'dashboard' },
    { href: '/timetable',               icon: 'fa-calendar-alt',   label: 'Timetable',        key: 'timetable' },
    { href: '/trainer/blog',            icon: 'fa-newspaper',      label: 'Blog',             key: 'blog' },
    { href: '/trainer/sessions',        icon: 'fa-dumbbell',       label: 'Manage Sessions',  key: 'sessions' },
  ];

  const adminLinks = [
    { href: '/admin/dashboard',   icon: 'fa-tachometer-alt',  label: 'Dashboard',   key: 'dashboard'  },
    { href: '/admin/sessions',    icon: 'fa-calendar-alt',    label: 'Sessions',     key: 'sessions'   },
    { href: '/admin/users',       icon: 'fa-users',           label: 'Users',        key: 'users'      },
    { href: '/admin/activities',  icon: 'fa-running',         label: 'Activities',   key: 'activities' },
    { href: '/admin/locations',   icon: 'fa-map-marker-alt',  label: 'Locations',    key: 'locations'  },
    { href: '/admin/bookings',    icon: 'fa-ticket-alt',      label: 'Bookings',     key: 'bookings'   },
    { href: '/admin/blogs',       icon: 'fa-blog',            label: 'Blog Posts',   key: 'blogs'      },
  ];

  let links;
  let roleLabel;
  if (user.role === 'admin') { links = adminLinks; roleLabel = 'Admin Panel'; }
  else if (user.role === 'trainer') { links = trainerLinks; roleLabel = 'Trainer Portal'; }
  else { links = memberLinks; roleLabel = 'Member Portal'; }

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const sidebarHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <a href="/" class="logo-text">
          <i class="fas fa-dumbbell"></i> FitGym
        </a>
        <div class="logo-subtitle">${roleLabel}</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-title">Navigation</div>
        ${links.map(link => `
          <a href="${link.href}" class="${activePage === link.key ? 'active' : ''}">
            <i class="fas ${link.icon}"></i>
            ${link.label}
          </a>
        `).join('')}
        <div class="nav-section-title" style="margin-top:8px;">Public</div>
        <a href="/blog" class="${activePage === 'public-blog' ? 'active' : ''}">
          <i class="fas fa-newspaper"></i> Blog
        </a>
        <a href="/" class="">
          <i class="fas fa-home"></i> Home
        </a>
      </nav>
      <div class="sidebar-footer">
        <div class="user-info-sidebar">
          <div class="user-avatar">
            ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : initials}
          </div>
          <div>
            <div class="user-name-sidebar">${user.name}</div>
            <div class="user-role-sidebar">${user.role}</div>
          </div>
        </div>
        <button class="btn-logout" onclick="logout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
  `;

  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) {
    navPlaceholder.innerHTML = sidebarHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
  }

  // Hamburger button functionality
  const hamburger = document.getElementById('hamburgerBtn');
  if (hamburger) {
    hamburger.addEventListener('click', toggleSidebar);
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

// Toast notification system
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Format date helper
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format time helper
function formatTime(timeStr) {
  if (!timeStr) return '-';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

// Format datetime
function formatDateTime(dtStr) {
  if (!dtStr) return '-';
  const d = new Date(dtStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Status badge helper
function statusBadge(status) {
  const map = {
    confirmed: 'badge-success',
    cancelled: 'badge-danger',
    completed: 'badge-info',
    published: 'badge-success',
    draft: 'badge-warning',
    active: 'badge-success',
    inactive: 'badge-gray',
    member: 'badge-info',
    trainer: 'badge-purple',
    admin: 'badge-warning'
  };
  return `<span class="badge ${map[status] || 'badge-gray'}">${status}</span>`;
}

// Confirm modal
function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 400px;">
      <div class="modal-body">
        <div class="confirm-dialog">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>${title}</h3>
          <p>${message}</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="confirmNo">Cancel</button>
        <button class="btn btn-danger" id="confirmYes">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirmNo').onclick = () => overlay.remove();
  overlay.querySelector('#confirmYes').onclick = () => { overlay.remove(); onConfirm(); };
}
