document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('member');
  if (!user) return;
  renderNav('create-blog');
});

async function submitBlog(statusOverride) {
  const alertBox = document.getElementById('alertBox');
  alertBox.innerHTML = '';

  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const category = document.getElementById('category').value;
  const featured_image = document.getElementById('featuredImage').value.trim();
  const status = statusOverride || document.getElementById('status').value;

  if (!title) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Title is required.</div>`;
    return;
  }
  if (!content) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Content is required.</div>`;
    return;
  }

  try {
    const data = await api.post('/blogs', { title, content, category, featured_image, status });
    alertBox.innerHTML = `<div class="alert alert-success">
      <i class="fas fa-check-circle"></i>
      Blog post ${status === 'published' ? 'published' : 'saved as draft'} successfully!
      <a href="/blog-detail?id=${data.blog.id}" style="color:var(--accent-gold);text-decoration:none;"> View post</a>
    </div>`;

    // Clear form
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    document.getElementById('category').value = '';
    document.getElementById('featuredImage').value = '';
    document.getElementById('status').value = 'draft';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}
