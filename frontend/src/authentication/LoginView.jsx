import { useState, useCallback, useEffect } from "react";
import { useAuthenticate } from "./useAuthenticate";
import { useNavigate } from "react-router";
import { FaDumbbell } from "react-icons/fa";

function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, status, user } = useAuthenticate();

  const onLoginClick = useCallback(() => {
    login(email, password);
  }, [email, password, login]);

  // Redirect after login - mirrors coffee project
  useEffect(() => {
    if (user) {
      navigate("/timetable");
    }
  }, [user, navigate]);

  const isLoading = status === "authenticating";

  return (
    <section className="flex flex-col gap-4 p-6 items-center">
      <FaDumbbell className="text-5xl text-primary mt-6" />
      <h1 className="text-3xl font-bold">High Street Gym</h1>
      <p className="opacity-60 text-sm mb-2">Login to your account</p>

      <label className="input w-full">
        <span className="label">Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="grow"
          type="email"
          placeholder="you@example.com"
          onKeyDown={(e) => e.key === "Enter" && onLoginClick()}
        />
      </label>

      <label className="input w-full">
        <span className="label">Password</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="grow"
          type="password"
          placeholder="••••••"
          onKeyDown={(e) => e.key === "Enter" && onLoginClick()}
        />
      </label>

      {/* Show error status - mirrors coffee project */}
      {status &&
        status !== "loaded" &&
        status !== "resuming" &&
        status !== "logged out" &&
        status !== "authenticating" && (
          <span className="text-error text-sm self-start">{status}</span>
        )}

      {/* Login button - disabled + spinner while loading (mirrors coffee project) */}
      <button
        disabled={isLoading}
        onClick={onLoginClick}
        className="btn btn-primary btn-lg self-stretch"
      >
        Login
        {isLoading && (
          <span className="loading loading-spinner loading-sm"></span>
        )}
      </button>

      <div className="divider">OR</div>

      <button
        onClick={() => navigate("/register")}
        className="btn btn-ghost self-stretch"
      >
        Don't have an account?{" "}
        <span className="text-primary font-semibold">Register</span>
      </button>
    </section>
  );
}

export default LoginView;
