import { useEffect, useState, useCallback } from "react";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { fetchAPI } from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton";

// Mirrors OrderManagementView from coffee project
function BookingsView() {
  // Restrict to members only
  useAuthenticate(["member"]);

  const { user } = useAuthenticate();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState(null);

  // Load member's bookings - mirrors coffee's order loading pattern
  const getBookings = useCallback(() => {
    if (!user) return;
    setBookings([]);
    setStatus(null);
    fetchAPI(
      "GET",
      "/bookings?member_id=" + user.id,
      null,
      localStorage.getItem("auth-key"),
    )
      .then((response) => {
        if (response.status == 200) {
          setBookings(response.body);
        } else {
          setStatus(response.body.message);
        }
      })
      .catch((error) => setStatus(String(error)));
  }, [user]);

  useEffect(() => {
    getBookings();
  }, [getBookings]);

  // Cancel a booking - mirrors coffee's DELETE pattern
  const cancelBooking = useCallback(
    (bookingId) => {
      fetchAPI(
        "DELETE",
        "/bookings/" + bookingId,
        null,
        localStorage.getItem("auth-key"),
      )
        .then((response) => {
          if (response.status == 200) {
            getBookings(); // Refresh list
          } else {
            setStatus(response.body.message);
          }
        })
        .catch((error) => setStatus(String(error)));
    },
    [getBookings],
  );

  return (
    <section className="flex flex-col items-center p-4 gap-4">
      <div className="flex justify-between items-center self-stretch">
        <h1 className="text-3xl font-bold">My Bookings</h1>

        {/* XML export button - mirrors coffee's XML download button */}
        {user && (
          <XMLDownloadButton
            route="/bookings/xml"
            authenticationKey={localStorage.getItem("auth-key") || ""}
            filename="my-bookings.xml"
            className="btn btn-outline btn-sm"
          >
            Export XML
          </XMLDownloadButton>
        )}
      </div>

      {status && <span className="text-error self-start">{status}</span>}

      {!status && bookings.length === 0 && (
        <span className="loading loading-spinner loading-xl mt-8"></span>
      )}

      {bookings.length === 0 && status === null && user && (
        <p className="opacity-60 mt-4">No bookings yet. Browse the timetable to book a session.</p>
      )}

      <ul className="list self-stretch">
        {bookings.map((booking) => (
          <li key={booking.id} className="list-row items-center gap-4">
            <div className="flex flex-col grow">
              <span className="font-semibold">{booking.activityName}</span>
              <span className="text-sm opacity-70">{booking.trainerName}</span>
              <span className="text-xs opacity-50">
                {new Date(booking.sessionDate).toLocaleDateString("en-AU", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}{" "}
                at {booking.sessionTime?.slice(0, 5)}
              </span>
              <span className="text-xs opacity-50">{booking.locationName}</span>
              <span
                className={`badge badge-sm mt-1 ${
                  booking.status === "confirmed"
                    ? "badge-success"
                    : booking.status === "cancelled"
                    ? "badge-error"
                    : "badge-neutral"
                }`}
              >
                {booking.status}
              </span>
            </div>

            {booking.status === "confirmed" && (
              <button
                onClick={() => cancelBooking(booking.id)}
                className="btn btn-error btn-sm"
              >
                Cancel
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default BookingsView;
