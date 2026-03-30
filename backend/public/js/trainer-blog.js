let editingBlogId = null;

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('trainer');
  if (!user) return;
  renderNav('blog');
  loadBlogs();
});

async function loadBlogs() {
  const tbody = document.getElementById('blogsTable');
  tbody.innerHTML = `<tr><td colspan="6"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;

  try {
    const data = await api.get('/blogs?mine=true');
    const blogs = data.blogs || [];

    if (blogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-blog"></i><p>No posts yet. <button onclick="openCreateModal()" style="color:var(--accent-gold);background:none;border:none;cursor:pointer;">Write your first post</button></p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = blogs.map(b => `
      <tr>
        <td>
          <div style="font-weight:600;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${b.title}</div>
        </td>
        <td>${b.category || '-'}</td>
        <td>${statusBadge(b.status)}</td>
        <td><i class="fas fa-eye" style="color:var(--text-secondary);"></i> ${b.views || 0}</td>
        <td style="font-size:0.82rem;color:var(--text-secondary);">${formatDate(b.created_at)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <a href="/blog-detail?id=${b.id}" class="btn btn-sm btn-info" target="_blank"><i class="fas fa-eye"></i></a>
            <button class="btn btn-sm btn-secondary" onclick="openEditModal(${b.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteBlog(${b.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="alert alert-danger">${err.message}</div></td></tr>`;
  }
}

function openCreateModal() {
  editingBlogId = null;
  document.getElementById('modalTitle').textContent = 'New Blog Post';
  document.getElementById('blogTitle').value = '';
  document.getElementById('blogCategory').value = '';
  document.getElementById('blogContent').value = '';
  document.getElementById('blogStatus').value = 'draft';
  document.getElementById('blogModal').classList.add('active');
}

async function openEditModal(id) {
  editingBlogId = id;
  try {
    const data = await apiFetch(`/blogs/${id}`);
    const b = data.blog;
    document.getElementById('modalTitle').textContent = 'Edit Blog Post';
    document.getElementById('blogTitle').value = b.title;
    document.getElementById('blogCategory').value = b.category || '';
    document.getElementById('blogContent').value = b.content || '';
    document.getElementById('blogStatus').value = b.status;
    document.getElementById('blogModal').classList.add('active');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

async function saveBlog() {
  const title = document.getElementById('blogTitle').value.trim();
  if (!title) { showToast('Title is required.', 'error'); return; }

  const body = {
    title,
    category: document.getElementById('blogCategory').value,
    content: document.getElementById('blogContent').value,
    status: document.getElementById('blogStatus').value
  };

  try {
    if (editingBlogId) {
      await api.put(`/blogs/${editingBlogId}`, body);
      showToast('Post updated!', 'success');
    } else {
      await api.post('/blogs', body);
      showToast('Post created!', 'success');
    }
    closeModal('blogModal');
    loadBlogs();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteBlog(id) {
  showConfirm('Delete Blog Post', 'Are you sure you want to delete this post? This cannot be undone.', async () => {
    try {
      await api.delete(`/blogs/${id}`);
      showToast('Post deleted.', 'success');
      loadBlogs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
