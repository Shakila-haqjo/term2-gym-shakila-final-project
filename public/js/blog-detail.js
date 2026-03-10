document.addEventListener('DOMContentLoaded', () => {
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

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    document.getElementById('blogContent').innerHTML = `<div class="alert alert-danger">No blog post ID specified.</div>`;
    return;
  }

  loadBlog(id);
});

async function loadBlog(id) {
  try {
    // Increment views
    fetch(`/api/blogs/${id}/view`, { method: 'POST' });

    const data = await apiFetch(`/blogs/${id}`);
    const blog = data.blog;

    if (!blog) {
      document.getElementById('blogContent').innerHTML = `<div class="alert alert-danger">Blog post not found.</div>`;
      return;
    }

    document.title = `${blog.title} - FitGym Blog`;

    document.getElementById('blogContent').innerHTML = `
      <article>
        ${blog.featured_image ? `
          <img src="${blog.featured_image}" alt="${blog.title}"
            style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin-bottom:28px;"
            onerror="this.style.display='none'">
        ` : ''}
        <div style="margin-bottom:20px;">
          ${blog.category ? `<span class="badge badge-warning" style="margin-bottom:10px;">${blog.category}</span>` : ''}
          <h1 style="font-size:2rem; font-weight:700; line-height:1.3; margin-bottom:12px;">${blog.title}</h1>
          <div style="display:flex; align-items:center; gap:20px; color:var(--text-secondary); font-size:0.875rem; flex-wrap:wrap;">
            <span><i class="fas fa-user" style="color:var(--accent-gold)"></i> ${blog.author_name}</span>
            <span><i class="fas fa-calendar" style="color:var(--accent-gold)"></i> ${formatDate(blog.created_at)}</span>
            <span><i class="fas fa-eye" style="color:var(--accent-gold)"></i> ${(blog.views || 0) + 1} views</span>
            ${blog.status === 'draft' ? '<span class="badge badge-warning">Draft</span>' : ''}
          </div>
        </div>
        <hr style="border:none; border-top:1px solid var(--border-color); margin:24px 0;">
        <div class="blog-content">
          ${blog.content || '<p style="color:var(--text-secondary);">No content available.</p>'}
        </div>
        <div style="margin-top:32px; padding-top:24px; border-top:1px solid var(--border-color); display:flex; gap:12px;">
          <a href="/blog.html" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Blog</a>
        </div>
      </article>
    `;
  } catch (err) {
    document.getElementById('blogContent').innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}
