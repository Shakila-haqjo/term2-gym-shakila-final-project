import { useState, useCallback, useEffect } from "react";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { fetchAPI } from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton";
import StatusPage from "../common/StatusPage";
import validator from "validator";

function ProfileView() {
  const { user, refresh, status: authStatus } = useAuthenticate();

  // ALL hooks must be declared before any early return
  const [name, setName]                       = useState("");
  const [phone, setPhone]                     = useState("");
  const [address, setAddress]                 = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading]                 = useState(false);
  const [status, setStatus]                   = useState(null);

  // Pre-fill form when user loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  const submitUpdate = useCallback(() => {
    setLoading(true);
    const errors = {};
    if (!/^[a-zA-Z\-\' ]{2,}$/.test(name)) errors.name = "Invalid name";
    if (phone && !validator.isMobilePhone(phone)) errors.phone = "Invalid phone number";
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) { setLoading(false); return; }

    fetchAPI(
      "PUT",
      "/users/" + user.id,
      { name, phone, address },
      localStorage.getItem("auth-key")
    )
      .then(response => {
        if (response.status == 200) {
          setStatus("Profile updated successfully!");
          refresh();
        } else {
          setStatus("Update failed: " + response.body.message);
        }
        setLoading(false);
      })
      .catch(error => { setStatus(String(error)); setLoading(false); });
  }, [name, phone, address, user, refresh]);

  // ── Access control — AFTER all hooks ─────────────────────────────────────
  // Show spinner while auth is resuming
  if (authStatus === "resuming") {
    return <span className="loading loading-spinner loading-xl m-8"></span>;
  }

  // Guest — show status page
  if (!user) {
    return (
      <StatusPage
        title="Login Required"
        message="You need to login to view your profile."
        actionLabel="Go to Login"
        actionPath="/login"
      />
    );
  }

  return (
    <section className="flex flex-col gap-4 p-4 items-center">
      <h1 className="text-3xl font-bold self-start">My Profile</h1>
      <p className="text-sm opacity-60 self-start">
        Role: <span className="badge badge-primary badge-sm">{user.role}</span>
      </p>
      <p className="text-sm opacity-60 self-start">Email: {user.email}</p>

      <fieldset className="fieldset rounded-box border p-4 self-stretch">
        <legend className="fieldset-legend text-xl p-2">Personal Details</legend>

        <label className="label">Full Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="input w-full"
          type="text"
        />
        {validationErrors.name && (
          <label className="label text-red-500">{validationErrors.name}</label>
        )}

        <label className="label">Phone</label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="input w-full"
          type="tel"
        />
        {validationErrors.phone && (
          <label className="label text-red-500">{validationErrors.phone}</label>
        )}

        <label className="label">Address</label>
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="input w-full"
          type="text"
        />
      </fieldset>

      {status && (
        <span className={
          status.includes("success") ? "text-success self-start" : "text-error self-start"
        }>
          {status}
        </span>
      )}

      <button
        disabled={loading}
        onClick={submitUpdate}
        className="btn btn-primary btn-xl self-stretch">
        Update Profile
        {loading && <span className="loading loading-spinner loading-sm"></span>}
      </button>

      {user.role === "trainer" && (
        <XMLDownloadButton
          route="/xml/sessions"
          authenticationKey={localStorage.getItem("auth-key") || ""}
          filename="my-sessions.xml"
          className="btn btn-outline self-stretch">
          Export My Sessions (XML)
        </XMLDownloadButton>
      )}

      {user.role === "member" && (
        <XMLDownloadButton
          route="/bookings/xml"
          authenticationKey={localStorage.getItem("auth-key") || ""}
          filename="my-bookings.xml"
          className="btn btn-outline self-stretch">
          Export My Bookings (XML)
        </XMLDownloadButton>
      )}
    </section>
  );
}

export default ProfileView;
