import { useEffect, useState, useCallback } from "react";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { fetchAPI } from "../api.mjs";

function BlogView() {
  const { user } = useAuthenticate();
  const [posts, setPosts]         = useState([]);
  const [status, setStatus]       = useState(null);
  const [title, setTitle]         = useState("");
  const [content, setContent]     = useState("");
  const [category, setCategory]   = useState("");
  const [postStatus, setPostStatus] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  // Confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState(null); // postId to delete

  const getPosts = useCallback(() => {
    setPosts([]); setStatus(null);
    fetchAPI("GET", "/blogs")
      .then(response => {
        if (response.status == 200) setPosts(response.body);
        else setStatus(response.body.message);
      })
      .catch(error => setStatus(String(error)));
  }, []);

  useEffect(() => { getPosts(); }, [getPosts]);

 const submitPost = useCallback(() => {
  setPostLoading(true);
  const errors = {};

  // Check for HTML tags and special scripts
  const hasHtmlTags = /<[^>]*>/g.test(title) || /<[^>]*>/g.test(content);

  if (!title || title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters";
  } else if (hasHtmlTags) {
    errors.title = "Title cannot contain HTML tags or special characters like < > / ";
  }

  if (!content || content.trim().length < 10) {
    errors.content = "Content must be at least 10 characters";
  } else if (/<[^>]*>/g.test(content)) {
    errors.content = "Content cannot contain HTML tags or special characters like < > / ";
  }

  setValidationErrors(errors);
  if (Object.keys(errors).length > 0) { setPostLoading(false); return; }

    fetchAPI("POST", "/blogs", { title, content, category }, localStorage.getItem("auth-key"))
      .then(response => {
        if (response.status == 200) {
          setTitle(""); setContent(""); setCategory("");
          setPostStatus(null); getPosts();
        } else { setPostStatus(response.body.message); }
        setPostLoading(false);
      })
      .catch(error => { setPostStatus(String(error)); setPostLoading(false); });
  }, [title, content, category, getPosts]);

  // Confirmation modal triggers
  const askDeletePost = (postId) => setConfirmDelete(postId);

  const confirmDeletePost = useCallback(() => {
    if (!confirmDelete) return;
    fetchAPI("DELETE", "/blogs/" + confirmDelete, null, localStorage.getItem("auth-key"))
      .then(response => {
        if (response.status == 200) getPosts();
        else setStatus(response.body.message);
      })
      .catch(error => setStatus(String(error)));
    setConfirmDelete(null);
  }, [confirmDelete, getPosts]);

  return (
    <section className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-3xl font-bold self-start">Blog</h1>

      {/* Create post form */}
      {user && (user.role === "member" || user.role === "trainer") && (
        <fieldset className="fieldset rounded-box border p-4 self-stretch">
          <legend className="fieldset-legend text-xl p-2">New Post</legend>

          <label className="label">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="input w-full" type="text" placeholder="Post title" />
          {validationErrors.title && <label className="label text-red-500">{validationErrors.title}</label>}

         <label className="label">Category (optional)</label>
           <input value={category} onChange={e => {
                const clean = e.target.value.replace(/<[^>]*>/g, "");
              setCategory(clean);
              }}
             className="input w-full" type="text" placeholder="e.g. Fitness Tips" />

          <label className="label">Content</label>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            className="textarea w-full" rows={4} placeholder="Write your post..." />
          {validationErrors.content && <label className="label text-red-500">{validationErrors.content}</label>}

          {postStatus && <span className="text-error text-sm">{postStatus}</span>}

          <button disabled={postLoading} onClick={submitPost}
            className="btn btn-primary mt-2 self-stretch">
            Post
            {postLoading && <span className="loading loading-spinner loading-sm"></span>}
          </button>
        </fieldset>
      )}

      {status && <span className="text-error self-start">{status}</span>}
      {!status && posts.length === 0 && (
        <span className="loading loading-spinner loading-xl mt-8"></span>
      )}

      {/* Blog post list */}
      <ul className="list self-stretch">
        {posts.map(post => (
          <li key={post.id} className="flex flex-col gap-2 p-4 border-b border-base-200">
            <div className="flex justify-between w-full items-start">
              <div>
                <span className="font-semibold text-base">{post.title}</span>
                {post.category && (
                  <span className="badge badge-ghost badge-sm ml-2">{post.category}</span>
                )}
              </div>
              {user && (user.role === "admin" || user.id === post.authorId) && (
                <button onClick={() => askDeletePost(post.id)}
                  className="btn btn-ghost btn-xs text-error">Delete</button>
              )}
            </div>

            {/* Blog post text — proper styling */}
            <p className="text-sm text-base-content leading-relaxed break-words overflow-hidden w-full">
                {post.content}
            </p>

            <span className="text-xs opacity-50">
              by {post.authorName} &bull;{" "}
              {new Date(post.createdAt).toLocaleDateString("en-AU", {
                day: "2-digit", month: "short", year: "numeric"
              })}
            </span>
          </li>
        ))}
      </ul>

      {/* Confirmation Modal — delete blog post */}
      {confirmDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Blog Post</h3>
            <p className="py-4">Are you sure you want to delete this blog post? This cannot be undone.</p>
            <div className="modal-action">
              <button onClick={() => setConfirmDelete(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={confirmDeletePost} className="btn btn-error">Delete</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setConfirmDelete(null)}></div>
        </div>
      )}
    </section>
  );
}

export default BlogView;
