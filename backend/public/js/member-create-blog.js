let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  // Check if we're in edit mode
  const params = new URLSearchParams(window.location.search);
  editingId = params.get('id') || null;

  if (editingId) {
    // Update page title to "Edit Post"
    const pageHeading = document.querySelector('.page-title, h1, [data-page-title]');
    if (pageHeading) pageHeading.textContent = 'Edit Blog Post';
    document.title = 'Edit Blog Post - FitGym';

    // Load existing blog data
    try {
      const res = await fetch(`/api/blogs/${editingId}`);
      if (!res.ok) throw new Error('Post not found');
      const { blog } = await res.json();

      document.getElementById('title').value = blog.title || '';
      document.getElementById('content').value = blog.content || '';
      document.getElementById('category').value = blog.category || '';
      document.getElementById('featuredImage').value = blog.featured_image || '';
      document.getElementById('status').value = blog.status || 'draft';

      // Update button labels
      document.querySelector('[data-action="publish"]').innerHTML = '<i class="fas fa-paper-plane"></i> Update & Publish';
      document.querySelector('[data-action="draft"]').innerHTML = '<i class="fas fa-save"></i> Save Changes';
    } catch (err) {
      document.getElementById('alertBox').innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Failed to load post: ${err.message}</div>`;
    }
  }
});

async function submitBlog(statusOverride) {
  const alertBox = document.getElementById('alertBox');
  alertBox.innerHTML = '';

  const title   = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const category = document.getElementById('category').value;
  const featured_image = document.getElementById('featuredImage').value.trim();
  const status  = statusOverride || document.getElementById('status').value;

  if (!title) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Title is required.</div>`;
    return;
  }
  if (!content) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Content is required.</div>`;
    return;
  }

  try {
    let data;
    if (editingId) {
      // Edit mode — PUT
      data = await api.put(`/blogs/${editingId}`, { title, content, category, featured_image, status });
    } else {
      // Create mode — POST
      data = await api.post('/blogs', { title, content, category, featured_image, status });
    }

    alertBox.innerHTML = `<div class="alert alert-success">
      <i class="fas fa-check-circle"></i>
      Blog post ${status === 'published' ? 'published' : 'saved as draft'} successfully!
      <a href="/blog-detail?id=${data.blog.id}" style="color:var(--accent-gold);text-decoration:none;"> View post &rarr;</a>
    </div>`;

    if (!editingId) {
      // Clear form only on create
      document.getElementById('title').value = '';
      document.getElementById('content').value = '';
      document.getElementById('category').value = '';
      document.getElementById('featuredImage').value = '';
      document.getElementById('status').value = 'draft';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}
