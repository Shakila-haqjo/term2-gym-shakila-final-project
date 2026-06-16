import { useEffect, useState, useCallback } from "react";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { fetchAPI } from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton";
import StatusPage from "../common/StatusPage";

function BookingsView() {
  const { user, status: authStatus } = useAuthenticate();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(true);

  // Show status page for guests and trainers
  if (authStatus !== "resuming" && !user) {
    return <StatusPage title="Login Required"
      message="You need to login to view your bookings."
      actionLabel="Go to Login" actionPath="/login" />;
  }
  if (user && user.role === "trainer") {
    return <StatusPage title="Unauthorised"
      message="Trainers cannot access the bookings page. Please use the Timetable to manage your sessions."
      actionLabel="Go to Timetable" actionPath="/timetable" />;
  }

  const getBookings = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setStatus(null);
    fetchAPI("GET", "/bookings?member_id=" + user.id, null, localStorage.getItem("auth-key"))
      .then(response => {
        if (response.status == 200) {
          setBookings(response.body);
        } else {
          setStatus(response.body.message);
        }
        setLoading(false);
      })
      .catch(error => { setStatus(String(error)); setLoading(false); });
  }, [user]);

  useEffect(() => { getBookings(); }, [getBookings]);

  const cancelBooking = useCallback(bookingId => {
    fetchAPI("DELETE", "/bookings/" + bookingId, null, localStorage.getItem("auth-key"))
      .then(response => {
        if (response.status == 200) { getBookings(); }
        else { setStatus(response.body.message); }
      })
      .catch(error => setStatus(String(error)));
  }, [getBookings]);

  return (
    <section className="flex flex-col items-center p-4 gap-4">
      <div className="flex justify-between items-center self-stretch">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        {user && (
          <XMLDownloadButton route="/bookings/xml"
            authenticationKey={localStorage.getItem("auth-key") || ""}
            filename="my-bookings.xml" className="btn btn-outline btn-sm">
            Export XML
          </XMLDownloadButton>
        )}
      </div>

      {status && <span className="text-error self-start">{status}</span>}

      {/* Only show spinner while actually loading */}
      {loading && <span className="loading loading-spinner loading-xl mt-8"></span>}

      {/* No bookings message — no spinner */}
      {!loading && bookings.length === 0 && !status && (
        <div className="flex flex-col items-center gap-2 mt-8 opacity-60">
          <p>No bookings yet.</p>
          <p className="text-sm">Browse the timetable to book a session.</p>
        </div>
      )}

      <ul className="list self-stretch">
        {bookings.map(booking => (
          <li key={booking.id} className="list-row items-center gap-4">
            <div className="flex flex-col grow">
              <span className="font-semibold">{booking.activityName}</span>
              <span className="text-sm opacity-70">{booking.trainerName}</span>
              <span className="text-xs opacity-50">
                {booking.sessionDate instanceof Date
                  ? booking.sessionDate.toLocaleDateString("en-AU")
                  : String(booking.sessionDate).split("T")[0]
                } at {booking.sessionTime?.slice(0, 5)}
              </span>
              <span className="text-xs opacity-50">{booking.locationName}</span>
              <span className={`badge badge-sm mt-1 ${
                booking.status === "confirmed" ? "badge-success" :
                booking.status === "cancelled" ? "badge-error" : "badge-neutral"
              }`}>{booking.status}</span>
            </div>
            {booking.status === "confirmed" && (
              <button onClick={() => cancelBooking(booking.id)}
                className="btn btn-error btn-sm">Cancel</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default BookingsView;
