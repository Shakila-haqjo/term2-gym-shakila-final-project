import { useState, useCallback, useEffect } from "react";
import { useAuthenticate } from "./useAuthenticate";
import { useNavigate } from "react-router";

function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [attempted, setAttempted] = useState(false); // only show error after attempt
  const { login, status, user } = useAuthenticate();

  const onLoginClick = useCallback(() => {
    setAttempted(true);
    login(email, password);
  }, [email, password, login]);

  useEffect(() => {
    if (user) navigate("/timetable");
  }, [user, navigate]);

  const isLoading = status === "authenticating";
  const showError = attempted && status && status !== "loaded" &&
    status !== "resuming" && status !== "logged out" && status !== "authenticating";

  return (
    <section className="flex flex-col gap-4 p-4 items-center min-h-screen justify-center">
      <h1 className="text-3xl font-bold">High Street Gym</h1>
      <p className="opacity-60 text-sm mb-2">Login to your account</p>

      <label className="input w-full">
        <span className="label">Email</span>
        <input value={email} onChange={e => setEmail(e.target.value)}
          className="grow" type="email" placeholder="you@example.com"
          onKeyDown={e => e.key === "Enter" && onLoginClick()} />
      </label>

      <label className="input w-full">
        <span className="label">Password</span>
        <input value={password} onChange={e => setPassword(e.target.value)}
          className="grow" type="password" placeholder="••••••"
          onKeyDown={e => e.key === "Enter" && onLoginClick()} />
      </label>

      {/* Only show error after user has attempted login */}
      {showError && <span className="text-error text-sm self-start">{status}</span>}

      <button disabled={isLoading} onClick={onLoginClick}
        className="btn btn-primary btn-lg self-stretch">
        Login
        {isLoading && <span className="loading loading-spinner loading-sm"></span>}
      </button>

      <div className="divider">OR</div>

      <button onClick={() => navigate("/register")} className="btn btn-ghost self-stretch">
        Don't have an account? <span className="text-primary ml-1">Register</span>
      </button>

      {/* Privacy Policy link (per feedback) */}
      <a href="#" className="text-xs opacity-50 hover:opacity-80 mt-2">Privacy Policy</a>

      {/* Copyright (per feedback) */}
      <p className="text-xs opacity-40 mt-2">
        &copy; {new Date().getFullYear()} High Street Gym. All rights reserved.
      </p>
    </section>
  );
}

export default LoginView;
