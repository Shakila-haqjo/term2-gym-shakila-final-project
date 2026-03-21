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

    const currentUser = getUser();

    grid.innerHTML = blogs.map(blog => {
      const isOwner = currentUser && currentUser.id === blog.author_id;
      return `
        <div class="blog-card">
          <div class="blog-card-body">
            <div class="blog-category">${blog.category || 'General'}</div>
            <h3 class="blog-card-title">
              <a href="/blog-detail?id=${blog.id}">${blog.title}</a>
            </h3>
            <div class="blog-card-meta">
              <span><i class="fas fa-user"></i> ${blog.author_name}</span>
              <span><i class="fas fa-eye"></i> ${blog.views || 0}</span>
              <span><i class="fas fa-calendar"></i> ${formatDate(blog.created_at)}</span>
            </div>
            ${isOwner ? `
              <button class="btn btn-danger btn-sm" style="margin-top:10px;width:100%;" onclick="deleteBlog(${blog.id})">
                <i class="fas fa-trash"></i> Delete
              </button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-exclamation-circle"></i><p>Failed to load blogs. ${err.message}</p></div>`;
  }
}

async function deleteBlog(id) {
  if (!confirm('Delete this blog post? This cannot be undone.')) return;
  try {
    await api.delete(`/blogs/${id}`);
    loadBlogs();
  } catch (err) {
    alert(err.message);
  }
}
