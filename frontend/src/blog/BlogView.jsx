import { useEffect, useState, useCallback } from "react";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { fetchAPI } from "../api.mjs";

function BlogView() {
  const { user } = useAuthenticate();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState(null);

  // Create post state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [postStatus, setPostStatus] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Load blog posts - mirrors coffee's getProducts pattern
  const getPosts = useCallback(() => {
    setPosts([]);
    setStatus(null);
    fetchAPI("GET", "/blogs")
      .then((response) => {
        if (response.status == 200) {
          setPosts(response.body);
        } else {
          setStatus(response.body.message);
        }
      })
      .catch((error) => setStatus(String(error)));
  }, []);

  useEffect(() => {
    getPosts();
  }, [getPosts]);

  // Create blog post - mirrors ProductCheckoutView's submitOrder pattern
  const submitPost = useCallback(() => {
    setPostLoading(true);

    // Validation - mirrors ProductCheckoutView
    const localValidationErrors = {};
    if (!title || title.trim().length < 3) {
      localValidationErrors["title"] = "Title must be at least 3 characters";
    }
    if (!content || content.trim().length < 10) {
      localValidationErrors["content"] = "Content must be at least 10 characters";
    }
    setValidationErrors(localValidationErrors);

    if (Object.keys(localValidationErrors).length > 0) {
      setPostLoading(false);
      return;
    }

    fetchAPI(
      "POST",
      "/blogs",
      { title, content, category },
      localStorage.getItem("auth-key"),
    )
      .then((response) => {
        if (response.status == 200) {
          setTitle("");
          setContent("");
          setCategory("");
          setPostStatus(null);
          getPosts();
          setPostLoading(false);
        } else {
          setPostStatus(response.body.message);
          setPostLoading(false);
        }
      })
      .catch((error) => {
        setPostStatus(String(error));
        setPostLoading(false);
      });
  }, [title, content, category, getPosts]);

  // Delete blog post
  const deletePost = useCallback(
    (postId) => {
      fetchAPI(
        "DELETE",
        "/blogs/" + postId,
        null,
        localStorage.getItem("auth-key"),
      )
        .then((response) => {
          if (response.status == 200) {
            getPosts();
          } else {
            setStatus(response.body.message);
          }
        })
        .catch((error) => setStatus(String(error)));
    },
    [getPosts],
  );

  return (
    <section className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-3xl font-bold self-start">Blog</h1>

      {/* Create Post form - visible to members and trainers */}
      {user && (user.role === "member" || user.role === "trainer") && (
        <fieldset className="fieldset rounded-box border p-4 self-stretch">
          <legend className="fieldset-legend text-xl p-2">New Post</legend>

          <label className="label">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input w-full"
            type="text"
            placeholder="Post title"
          />
          {validationErrors["title"] && (
            <label className="label text-red-500 justify-self-end">
              {validationErrors["title"]}
            </label>
          )}

          <label className="label">Category (optional)</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-full"
            type="text"
            placeholder="e.g. Fitness Tips"
          />

          <label className="label">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="textarea w-full"
            rows={4}
            placeholder="Write your post..."
          />
          {validationErrors["content"] && (
            <label className="label text-red-500 justify-self-end">
              {validationErrors["content"]}
            </label>
          )}

          {postStatus && (
            <span className="text-error text-sm">{postStatus}</span>
          )}

          {/* Post button - disabled + spinner while loading (mirrors Pay button) */}
          <button
            disabled={postLoading == true}
            onClick={() => submitPost()}
            className="btn btn-primary mt-2 self-stretch"
          >
            Post
            {postLoading && (
              <span className="loading loading-spinner loading-sm"></span>
            )}
          </button>
        </fieldset>
      )}

      {status && <span className="text-error self-start">{status}</span>}

      {!status && posts.length === 0 && (
        <span className="loading loading-spinner loading-xl mt-8"></span>
      )}

      {/* Blog post list */}
      <ul className="list self-stretch">
        {posts.map((post) => (
          <li key={post.id} className="list-row flex-col items-start gap-1 p-4">
            <div className="flex justify-between w-full items-start">
              <div>
                <span className="font-semibold text-base">{post.title}</span>
                {post.category && (
                  <span className="badge badge-ghost badge-sm ml-2">
                    {post.category}
                  </span>
                )}
              </div>
              {/* Delete button - own post or admin */}
              {user &&
                (user.role === "admin" || user.id === post.authorId) && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="btn btn-ghost btn-xs text-error"
                  >
                    Delete
                  </button>
                )}
            </div>
            <p className="text-sm opacity-80 mt-1">{post.content}</p>
            <span className="text-xs opacity-50 mt-1">
              by {post.authorName} &bull;{" "}
              {new Date(post.createdAt).toLocaleDateString("en-AU", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default BlogView;
