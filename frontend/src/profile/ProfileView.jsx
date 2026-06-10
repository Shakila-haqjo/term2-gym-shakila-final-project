import { useState, useCallback, useEffect } from "react";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { fetchAPI } from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton";
import validator from "validator";

function ProfileView() {
  // Restrict to logged-in users (member or trainer)
  useAuthenticate(["member", "trainer"]);

  const { user, refresh } = useAuthenticate();

  // Form state - pre-filled with user data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Submission state - mirrors ProductCheckoutView pattern
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // Pre-fill form when user loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  // Update profile - mirrors ProductCheckoutView submitOrder pattern
  const submitUpdate = useCallback(() => {
    setLoading(true);

    // Validation - mirrors ProductCheckoutView validation
    const localValidationErrors = {};
    if (!/^[a-z-A-Z\-\' ]{2,}$/.test(name)) {
      localValidationErrors["name"] = "Missing or invalid name";
    }
    if (phone && !validator.isMobilePhone(phone)) {
      localValidationErrors["phone"] = "Invalid phone number";
    }
    setValidationErrors(localValidationErrors);

    if (Object.keys(localValidationErrors).length > 0) {
      setLoading(false);
      return;
    }

    // PUT /api/users/:id
    fetchAPI(
      "PUT",
      "/users/" + user.id,
      { name, phone, address },
      localStorage.getItem("auth-key"),
    )
      .then((response) => {
        if (response.status == 200) {
          setStatus("Profile updated successfully!");
          refresh(); // Re-load user data
          setLoading(false);
        } else {
          setStatus("Update failed: " + response.body.message);
          setLoading(false);
        }
      })
      .catch((error) => {
        setStatus("Update failed: " + error);
        setLoading(false);
      });
  }, [name, phone, address, user, refresh]);

  if (!user) {
    return (
      <section className="flex justify-center p-8">
        <span className="loading loading-spinner loading-xl"></span>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 p-4 items-center">
      <h1 className="text-3xl font-bold self-start">My Profile</h1>
      <p className="text-sm opacity-60 self-start">
        Role: <span className="badge badge-primary badge-sm">{user.role}</span>
      </p>
      <p className="text-sm opacity-60 self-start">Email: {user.email}</p>

      {/* Personal Details fieldset - mirrors coffee project's fieldset pattern */}
      <fieldset className="fieldset rounded-box border p-4 self-stretch">
        <legend className="fieldset-legend text-xl p-2">Personal Details</legend>

        <label className="label">Full Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input w-full"
          type="text"
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
        />
        {validationErrors["phone"] && (
          <label className="label text-red-500 justify-self-end">
            {validationErrors["phone"]}
          </label>
        )}

        <label className="label">Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input w-full"
          type="text"
        />
      </fieldset>

      {status && (
        <span
          className={
            status.includes("success") ? "text-success self-start" : "text-error self-start"
          }
        >
          {status}
        </span>
      )}

      {/* Update button - disabled + spinner while loading (mirrors Pay button) */}
      <button
        disabled={loading == true}
        onClick={() => submitUpdate()}
        className="btn btn-primary btn-xl self-stretch"
      >
        Update Profile
        {loading && (
          <span className="loading loading-spinner loading-sm"></span>
        )}
      </button>

      {/* XML Export - role-specific (mirrors coffee's XMLDownloadButton usage) */}
      {user.role === "trainer" && (
        <XMLDownloadButton
          route="/xml/sessions"
          authenticationKey={localStorage.getItem("auth-key") || ""}
          filename="my-sessions.xml"
          className="btn btn-outline self-stretch"
        >
          Export My Sessions (XML)
        </XMLDownloadButton>
      )}

      {user.role === "member" && (
        <XMLDownloadButton
          route="/xml/bookings"
          authenticationKey={localStorage.getItem("auth-key") || ""}
          filename="my-bookings.xml"
          className="btn btn-outline self-stretch"
        >
          Export My Bookings (XML)
        </XMLDownloadButton>
      )}
    </section>
  );
}

export default ProfileView;
