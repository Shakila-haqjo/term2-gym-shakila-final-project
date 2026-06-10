import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { fetchAPI } from "../api.mjs";
import validator from "validator";

function RegisterView() {
  const navigate = useNavigate();

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Mirrors ProductCheckoutView pattern exactly
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const submitRegister = useCallback(() => {
    setLoading(true);

    // Validation - mirrors ProductCheckoutView's submitOrder validation pattern
    const localValidationErrors = {};

    if (!/^[a-z-A-Z\-\' ]{2,}$/.test(name)) {
      localValidationErrors["name"] = "Missing or invalid name (letters only, min 2 characters)";
    }
    if (!validator.isEmail(email)) {
      localValidationErrors["email"] = "Missing or invalid email address";
    }
    if (phone && !validator.isMobilePhone(phone)) {
      localValidationErrors["phone"] = "Invalid phone number";
    }
    if (password.length < 6) {
      localValidationErrors["password"] = "Password must be at least 6 characters";
    }

    setValidationErrors(localValidationErrors);

    // Early return if there were any validation errors - mirrors ProductCheckoutView
    if (Object.keys(localValidationErrors).length > 0) {
      setLoading(false);
      return;
    }

    // POST /api/register
    fetchAPI("POST", "/register", { name, email, password, phone, address })
      .then((response) => {
        if (response.status == 200) {
          navigate("/login");
        } else {
          setStatus("Registration failed: " + response.body.message);
          setLoading(false);
        }
      })
      .catch((error) => {
        setStatus("Registration failed: " + error);
        setLoading(false);
      });
  }, [name, email, password, phone, address, validationErrors, navigate]);

  return (
    <section className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-3xl font-bold mt-4">Create Account</h1>
      <p className="opacity-60 text-sm">Join High Street Gym</p>

      {status && <span className="text-error text-sm self-start">{status}</span>}

      {/* Personal Details - mirrors coffee's fieldset pattern */}
      <fieldset className="fieldset rounded-box border p-4 self-stretch">
        <legend className="fieldset-legend text-xl p-2">Personal Details</legend>

        <label className="label">Full Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input w-full"
          type="text"
          placeholder="Jane Smith"
        />
        {validationErrors["name"] && (
          <label className="label text-red-500 justify-self-end">
            {validationErrors["name"]}
          </label>
        )}

        <label className="label">Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input w-full"
          type="tel"
          placeholder="0400 000 000"
        />
        {validationErrors["phone"] && (
          <label className="label text-red-500 justify-self-end">
            {validationErrors["phone"]}
          </label>
        )}

        <label className="label">Address (optional)</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input w-full"
          type="text"
          placeholder="123 Main St, Brisbane"
        />
      </fieldset>

      {/* Login Credentials */}
      <fieldset className="fieldset rounded-box border p-4 self-stretch">
        <legend className="fieldset-legend text-xl p-2">Login Details</legend>

        <label className="label">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input w-full"
          type="email"
          placeholder="you@example.com"
        />
        {validationErrors["email"] && (
          <label className="label text-red-500 justify-self-end">
            {validationErrors["email"]}
          </label>
        )}

        <label className="label">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input w-full"
          type="password"
          placeholder="Min 6 characters"
        />
        {validationErrors["password"] && (
          <label className="label text-red-500 justify-self-end">
            {validationErrors["password"]}
          </label>
        )}
      </fieldset>

      {/* Register button - disabled + spinner while loading, mirrors ProductCheckoutView Pay button */}
      <button
        disabled={loading == true}
        onClick={() => submitRegister()}
        className="btn btn-primary btn-xl self-stretch"
      >
        Register
        {loading && (
          <span className="loading loading-spinner loading-sm"></span>
        )}
      </button>

      <button onClick={() => navigate("/login")} className="btn btn-ghost self-stretch">
        Already have an account? Login
      </button>
    </section>
  );
}

export default RegisterView;
