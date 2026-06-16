/**
 * StatusPage.jsx
 * Shows a status message when access is denied or login is required.
 * Used for: guests accessing /profile or /bookings
 *           trainers accessing /bookings
 */
import { useNavigate } from "react-router";
import { FaLock } from "react-icons/fa";

function StatusPage({ title = "Access Denied", message, actionLabel, actionPath }) {
  const navigate = useNavigate();
  return (
    <section className="flex flex-col items-center justify-center gap-4 p-8 min-h-[60vh]">
      <FaLock className="text-5xl text-warning" />
      <h1 className="text-2xl font-bold text-center">{title}</h1>
      <p className="text-center opacity-70">{message}</p>
      {actionLabel && actionPath && (
        <button onClick={() => navigate(actionPath)} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </section>
  );
}

export default StatusPage;
