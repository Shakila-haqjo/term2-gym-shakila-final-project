document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('admin');
  if (!user) return;
  renderNav('blogs');
  loadBlogs();

  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadBlogs, 400);
  });
  document.getElementById('statusFilter').addEventListener('change', loadBlogs);
});

async function loadBlogs() {
  const tbody = document.getElementById('blogsTable');
  const search = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('statusFilter').value;

  let url = '/blogs?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (status) url += `status=${status}`;

  tbody.innerHTML = `<tr><td colspan="7"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;

  try {
    const data = await apiFetch(url);
    const blogs = data.blogs || [];

    if (blogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-blog"></i><p>No blog posts found.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = blogs.map(b => `
      <tr>
        <td style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;">${b.title}</td>
        <td>${b.author_name || '-'}</td>
        <td>${b.category || '-'}</td>
        <td>${statusBadge(b.status)}</td>
        <td><i class="fas fa-eye" style="color:var(--text-secondary);"></i> ${b.views || 0}</td>
        <td style="font-size:0.82rem;color:var(--text-secondary);">${formatDate(b.created_at)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <a href="/blog-detail?id=${b.id}" class="btn btn-sm btn-info" target="_blank" title="View"><i class="fas fa-eye"></i></a>
            <button class="btn btn-sm btn-danger" onclick="deleteBlog(${b.id})" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="alert alert-danger">${err.message}</div></td></tr>`;
  }
}

async function deleteBlog(id) {
  showConfirm('Delete Blog Post', 'Are you sure you want to delete this post permanently?', async () => {
    try {
      await api.delete(`/blogs/${id}`);
      showToast('Blog post deleted.', 'success');
      loadBlogs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
