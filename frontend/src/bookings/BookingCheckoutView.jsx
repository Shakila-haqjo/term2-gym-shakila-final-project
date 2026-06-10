import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { fetchAPI } from "../api.mjs";
import { useAuthenticate } from "../authentication/useAuthenticate";

/**
 * BookingCheckoutView
 *
 * The gym equivalent of ProductCheckoutView from the coffee project.
 *
 * Mapping:
 *   Coffee: product      → Gym: session
 *   Coffee: order        → Gym: booking
 *   Coffee: Pay button   → Gym: Book Session button
 *   Coffee: POST /orders → Gym: POST /bookings
 *
 * Key requirement from teacher:
 *   The Book button must be DISABLED and show a SPINNER while the booking
 *   is being submitted. This is the same pattern as the Pay button in
 *   ProductCheckoutView.
 */
function BookingCheckoutView() {
  // Restrict to members only - redirect to /login if not a member
  useAuthenticate(["member"]);

  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user } = useAuthenticate();

  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(null);

  // Mirrors coffee: fetch product by id → here fetch session by id
  useEffect(() => {
    if (sessionId) {
      fetchAPI("GET", "/sessions/" + sessionId)
        .then((response) => {
          if (response.status == 200) {
            setSession(response.body);
            setStatus(null);
          } else {
            setStatus(response.body.message);
          }
        })
        .catch((error) => {
          setStatus(String(error));
        });
    }
  }, [sessionId]);

  // Mirrors coffee: order details state → here we don't need extra fields
  // because the booking just needs sessionId + auth key (member is already known)
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Mirrors coffee's submitOrder exactly:
  //  1. setLoading(true)    — disables button, shows spinner
  //  2. validate
  //  3. POST the booking
  //  4. on error: setLoading(false) — re-enables button
  const submitBooking = useCallback(() => {
    setLoading(true);

    // No extra customer details needed (member is authenticated)
    // POST /api/bookings with sessionId
    fetchAPI(
      "POST",
      "/bookings",
      { sessionId: session.id },
      localStorage.getItem("auth-key"),
    )
      .then((response) => {
        if (response.status == 200) {
          // Success - go to bookings list (mirrors coffee's navigate to order)
          navigate("/bookings");
        } else {
          setStatus("Failed to create booking - " + response.body.message);
          setLoading(false);
        }
      })
      .catch((error) => {
        setStatus("Failed to create booking - " + error);
        setLoading(false);
      });
  }, [session, navigate]);

  return (
    <section className="flex flex-col items-center gap-4 p-4">
      {/* Loading state - mirrors coffee project */}
      {!status && !session && (
        <span className="loading loading-spinner loading-xl mt-8"></span>
      )}

      {status && <span className="text-error">{status}</span>}

      {!status && session && (
        <>
          <h1 className="text-3xl font-bold self-start">{session.activityName}</h1>

          {/* Session details - mirrors coffee's product details fieldset */}
          <fieldset className="fieldset rounded-box border p-4 self-stretch">
            <legend className="fieldset-legend text-2xl p-2">
              Session Details
            </legend>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-60">Trainer</span>
                <span className="font-semibold">{session.trainerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Date</span>
                <span className="font-semibold">
                  {new Date(session.date).toLocaleDateString("en-AU", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Time</span>
                <span className="font-semibold">{session.time?.slice(0, 5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Duration</span>
                <span className="font-semibold">{session.durationMinutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Location</span>
                <span className="font-semibold">{session.locationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Availability</span>
                <span className="font-semibold">
                  {session.maxParticipants - session.bookedCount} spots left
                </span>
              </div>
              {session.description && (
                <div className="mt-2 pt-2 border-t opacity-70">
                  {session.description}
                </div>
              )}
            </div>
          </fieldset>

          {/* Book Session button - DISABLED + SPINNER while loading */}
          {/* This is the gym equivalent of the Pay button in ProductCheckoutView */}
          <button
            disabled={loading == true}
            onClick={() => submitBooking()}
            className="btn btn-primary btn-xl self-stretch"
          >
            Book Session
            {loading && (
              <span className="loading loading-spinner loading-sm"></span>
            )}
          </button>

          <button
            onClick={() => navigate("/timetable")}
            className="btn btn-ghost self-stretch"
          >
            Back to Timetable
          </button>
        </>
      )}
    </section>
  );
}

export default BookingCheckoutView;
