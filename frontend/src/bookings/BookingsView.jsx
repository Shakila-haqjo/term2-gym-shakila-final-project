import { useEffect, useState, useCallback } from "react";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { fetchAPI } from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton";
import StatusPage from "../common/StatusPage";

function BookingsView() {
  const { user, status: authStatus } = useAuthenticate();
  const [bookings, setBookings]       = useState([]);
  const [status, setStatus]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(null); // bookingId to cancel

  // ── Access control ────────────────────────────────────────────────────────
  if (authStatus === "resuming") {
    return <span className="loading loading-spinner loading-xl m-8"></span>;
  }

  if (!user) {
    return (
      <StatusPage
        title="Login Required"
        message="You need to login to view your bookings."
        actionLabel="Go to Login"
        actionPath="/login"
      />
    );
  }

  if (user.role === "trainer") {
    return (
      <StatusPage
        title="Unauthorised"
        message="Trainers cannot access the bookings page. Please use My Sessions to manage your sessions."
        actionLabel="Go to My Sessions"
        actionPath="/timetable"
      />
    );
  }

  // ── Data fetching ─────────────────────────────────────────────────────────
  const getBookings = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setStatus(null);
    fetchAPI(
      "GET",
      "/bookings?member_id=" + user.id,
      null,
      localStorage.getItem("auth-key")
    )
      .then(response => {
        if (response.status == 200) {
          // Only show confirmed bookings — cancelled ones should not appear
          const confirmed = response.body.filter(b => b.status === "confirmed");
          setBookings(confirmed);
        } else {
          setStatus(response.body.message);
        }
        setLoading(false);
      })
      .catch(error => { setStatus(String(error)); setLoading(false); });
  }, [user]);

  useEffect(() => { getBookings(); }, [getBookings]);

  // ── Cancel booking (confirmed, then refresh) ─────────────────────────────
  const doCancelBooking = useCallback(() => {
    if (!confirmCancel) return;
    const bookingId = confirmCancel;
    setConfirmCancel(null);

    fetchAPI(
      "DELETE",
      "/bookings/" + bookingId,
      null,
      localStorage.getItem("auth-key")
    )
      .then(response => {
        if (response.status == 200) {
          getBookings(); // refresh — cancelled booking will not appear
        } else {
          setStatus(response.body.message);
        }
      })
      .catch(error => setStatus(String(error)));
  }, [confirmCancel, getBookings]);

  return (
    <section className="flex flex-col items-center p-4 gap-4">
      <div className="flex justify-between items-center self-stretch">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <XMLDownloadButton
          route="/bookings/xml"
          authenticationKey={localStorage.getItem("auth-key") || ""}
          filename="my-bookings.xml"
          className="btn btn-outline btn-sm">
          Export XML
        </XMLDownloadButton>
      </div>

      {status && <span className="text-error self-start">{status}</span>}

      {/* Spinner — only while loading */}
      {loading && (
        <span className="loading loading-spinner loading-xl mt-8"></span>
      )}

      {/* No bookings message */}
      {!loading && bookings.length === 0 && !status && (
        <div className="flex flex-col items-center gap-2 mt-8 opacity-60">
          <p>No bookings yet.</p>
          <p className="text-sm">Browse the timetable to book a session.</p>
        </div>
      )}

      {/* Bookings list — only confirmed bookings shown */}
      <ul className="list self-stretch">
        {bookings.map(booking => (
          <li key={booking.id} className="list-row items-center gap-4">
            <div className="flex flex-col grow">
              <span className="font-semibold">{booking.activityName}</span>
              <span className="text-sm opacity-70">{booking.trainerName}</span>
              <span className="text-xs opacity-50">
                {String(booking.sessionDate).split("T")[0]} at{" "}
                {booking.sessionTime?.slice(0, 5)}
              </span>
              <span className="text-xs opacity-50">{booking.locationName}</span>
              <span className="badge badge-success badge-sm mt-1">
                confirmed
              </span>
            </div>
            <button
              onClick={() => setConfirmCancel(booking.id)}
              className="btn btn-error btn-sm">
              Cancel
            </button>
          </li>
        ))}
      </ul>

      {/* Confirmation Modal — cancel booking */}
      {confirmCancel && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Cancel Booking</h3>
            <p className="py-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                onClick={() => setConfirmCancel(null)}
                className="btn btn-ghost">
                Keep Booking
              </button>
              <button
                onClick={doCancelBooking}
                className="btn btn-error">
                Cancel Booking
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setConfirmCancel(null)}>
          </div>
        </div>
      )}
    </section>
  );
}

export default BookingsView;
