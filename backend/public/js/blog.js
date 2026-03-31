document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();

  // Show "Write a Post" button for members only
  if (user && user.role === 'member') {
    const writeBtn = document.getElementById('writePostBtn');
    if (writeBtn) writeBtn.style.display = 'inline-flex';
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
    const res = await fetch('/api' + url);
    const data = await res.json();
    const blogs = data.blogs || [];

    if (blogs.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-newspaper"></i><p>No blog posts found.</p></div>`;
      return;
    }

    const currentUser = getUser();

    grid.innerHTML = blogs.map(blog => {
      const isOwner = currentUser && currentUser.id === blog.author_id;
      const isAdmin = currentUser && currentUser.role === 'admin';
      const canEdit = isOwner;
      const canDelete = isOwner || isAdmin;

      const safeTitle    = escapeHtml(blog.title);
      const safeCategory = escapeHtml(blog.category || 'General');
      const safeAuthor   = escapeHtml(blog.author_name);

      return `
        <div class="blog-card">
          <div class="blog-card-body">
            <div class="blog-category">${safeCategory}</div>
            <h3 class="blog-card-title">
              <a href="/blog-detail?id=${blog.id}">${safeTitle}</a>
            </h3>
            <div class="blog-card-meta">
              <span><i class="fas fa-user"></i> ${safeAuthor}</span>
              <span><i class="fas fa-eye"></i> ${blog.views || 0}</span>
              <span><i class="fas fa-calendar"></i> ${formatDate(blog.created_at)}</span>
            </div>
            ${canEdit || canDelete ? `
              <div style="display:flex;gap:8px;margin-top:10px;">



                ${canEdit ? `<button class="btn btn-secondary btn-sm" style="flex:1;" onclick="editBlog(${blog.id})">
                  <i class="fas fa-edit"></i> Edit
                </button>` : ''}


                
                ${canDelete ? `<button class="btn btn-danger btn-sm" style="flex:1;" onclick="deleteBlog(${blog.id})">
                  <i class="fas fa-trash"></i> Delete
                </button>` : ''}
              </div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-exclamation-circle"></i><p>Failed to load blogs. ${err.message}</p></div>`;
  }
}

function editBlog(id) {
  const user = getUser();
  if (user && user.role === 'trainer') {
    window.location.href = `/trainer/blog`;
  } else {
    window.location.href = `/member/create-blog?id=${id}`;
  }
}

async function deleteBlog(id) {
  showConfirm('Delete Blog Post', 'Are you sure you want to delete this blog post? This cannot be undone.', async () => {
    try {
      await api.delete(`/blogs/${id}`);
      showToast('Blog post deleted.', 'success');
      loadBlogs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
