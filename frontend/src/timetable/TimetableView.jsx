import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { fetchAPI } from "../api.mjs";
import { useAuthenticate } from "../authentication/useAuthenticate";

function TimetableView() {
  const navigate = useNavigate();
  const { user } = useAuthenticate();
  const [sessions, setSessions]           = useState([]);
  const [status, setStatus]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(null);

  const isTrainer = user && user.role === "trainer";

  const getSessions = useCallback(() => {
    setSessions([]);
    setStatus(null);
    setLoading(true);

    // If trainer — only fetch their own sessions using trainer_id filter
    const url = isTrainer
      ? "/sessions?trainer_id=" + user.id
      : "/sessions";

    const timeout = setTimeout(() => {
      setLoading(false);
      setStatus("No sessions available at this time.");
    }, 5000);

    fetchAPI("GET", url)
      .then(response => {
        clearTimeout(timeout);
        setLoading(false);
        if (response.status == 200) {
          setSessions(response.body);
          if (response.body.length === 0) {
            setStatus("No sessions available at this time.");
          }
        } else {
          setStatus(response.body.message);
        }
      })
      .catch(error => {
        clearTimeout(timeout);
        setLoading(false);
        setStatus(String(error));
      });
  }, [user, isTrainer]);

  useEffect(() => { getSessions(); }, [getSessions]);

  // Delete session directly (confirmed)
  const doDeleteSession = useCallback((sessionId) => {
    const authKey = localStorage.getItem("auth-key");
    fetch("http://localhost:3000/api/sessions/" + sessionId, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-auth-key": authKey,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.message === "Session cancelled" || data.message === "Session deleted") {
          getSessions();
        } else {
          setStatus("Error: " + data.message);
        }
      })
      .catch(error => setStatus("Error: " + String(error)));
  }, [getSessions]);

  return (
    <section className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-3xl font-bold self-start">
        {isTrainer ? "My Sessions" : "Timetable"}
      </h1>

      {/* Spinner — only while loading */}
      {loading && (
        <span className="loading loading-spinner loading-xl mt-8"></span>
      )}

      {/* No sessions message */}
      {!loading && sessions.length === 0 && (
        <div className="flex flex-col items-center gap-2 mt-8 opacity-60">
          <p className="text-lg">{status || "No sessions available at this time."}</p>
          <p className="text-sm">Check back later for upcoming sessions.</p>
        </div>
      )}

      {/* Error message when sessions exist */}
      {!loading && sessions.length > 0 && status && (
        <span className="text-error self-start">{status}</span>
      )}

      <ul className="list self-stretch">
        {sessions.map(session => (
          <li key={session.id} className="list-row items-center gap-4">
            <div className="flex flex-col grow">
              <span className="font-semibold">{session.activityName}</span>
              <span className="text-sm opacity-70">{session.trainerName}</span>
              <span className="text-xs opacity-50">
                {String(session.date).split("T")[0]} at {session.time?.slice(0, 5)}
              </span>
              <span className="text-xs opacity-50">
                {session.locationName} &bull; {session.durationMinutes} min
              </span>
              <span className="text-xs opacity-40">
                {session.bookedCount}/{session.maxParticipants} booked
              </span>
            </div>

            {/* Book button — members only */}
            {user && user.role === "member" && (
              <button
                onClick={() => navigate("/bookings/create/" + session.id)}
                disabled={session.bookedCount >= session.maxParticipants}
                className="btn btn-primary btn-sm">
                {session.bookedCount >= session.maxParticipants ? "Full" : "Book"}
              </button>
            )}

            {/* Cancel button — trainers only on their own sessions */}
            {isTrainer && Number(session.trainerId) === Number(user.id) && (
              <button
                onClick={() => setConfirmCancel(session.id)}
                className="btn btn-error btn-sm">
                Cancel
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Confirmation Modal — cancel session */}
      {confirmCancel && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Cancel Session</h3>
            <p className="py-4">
              Are you sure you want to cancel this session? All member bookings
              for this session will be affected.
            </p>
            <div className="modal-action">
              <button onClick={() => setConfirmCancel(null)}
                className="btn btn-ghost">Keep Session</button>
              <button
                onClick={() => {
                  const id = confirmCancel;
                  setConfirmCancel(null);
                  doDeleteSession(id);
                }}
                className="btn btn-error">Cancel Session</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setConfirmCancel(null)}></div>
        </div>
      )}
    </section>
  );
}

export default TimetableView;
