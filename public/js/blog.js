document.addEventListener('DOMContentLoaded', () => {
  // If logged in, update nav
  const user = getUser();
  if (user) {
    const nav = document.getElementById('publicNav');
    if (nav) {
      nav.querySelector('.landing-nav-links').innerHTML = `
        <a href="${getDashboardUrl(user.role)}" class="btn btn-primary" style="padding:7px 16px;">
          <i class="fas fa-tachometer-alt"></i> Dashboard
        </a>
      `;
    }
  }

  loadBlogs();

  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadBlogs, 400);
  });
  document.getElementById('categoryFilter').addEventListener('change', loadBlogs);
});

async function loadBlogs() {
  const grid = document.getElementById('blogGrid');
  const search = document.getElementById('searchInput').value.trim();
  const category = document.getElementById('categoryFilter').value;

  let url = '/blogs?status=published';
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;

  grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;"><div class="spinner"></div></div>';

  try {
    const data = await apiFetch(url);
    const blogs = data.blogs || [];

    if (blogs.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-newspaper"></i><p>No blog posts found.</p></div>`;
      return;
    }

    grid.innerHTML = blogs.map(blog => `
      <div class="blog-card">
        <div class="blog-card-img">
          ${blog.featured_image
            ? `<img src="${blog.featured_image}" alt="${blog.title}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-newspaper\\'></i>'">`
            : '<i class="fas fa-newspaper"></i>'
          }
        </div>
        <div class="blog-card-body">
          <div class="blog-category">${blog.category || 'General'}</div>
          <h3 class="blog-card-title">
            <a href="/blog-detail.html?id=${blog.id}">${blog.title}</a>
          </h3>
          <div class="blog-card-meta">
            <span><i class="fas fa-user"></i> ${blog.author_name}</span>
            <span><i class="fas fa-eye"></i> ${blog.views || 0}</span>
            <span><i class="fas fa-calendar"></i> ${formatDate(blog.created_at)}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-exclamation-circle"></i><p>Failed to load blogs. ${err.message}</p></div>`;
  }
}
