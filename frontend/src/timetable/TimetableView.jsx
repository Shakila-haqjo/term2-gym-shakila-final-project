import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { fetchAPI } from "../api.mjs";
import { useAuthenticate } from "../authentication/useAuthenticate";

function TimetableView() {
  const navigate = useNavigate();
  const { user } = useAuthenticate();
  const [sessions, setSessions]     = useState([]);
  const [status, setStatus]         = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null); // sessionId to cancel

  const getSessions = useCallback(() => {
    setSessions([]); setStatus(null);
    fetchAPI("GET", "/sessions")
      .then(response => {
        if (response.status == 200) setSessions(response.body);
        else setStatus(response.body.message);
      })
      .catch(error => setStatus(String(error)));
  }, []);

  useEffect(() => { getSessions(); }, [getSessions]);

  // Ask confirmation before cancel
  const askCancelSession = (sessionId) => setConfirmCancel(sessionId);

  const confirmCancelSession = useCallback(() => {
    if (!confirmCancel) return;
    fetchAPI("DELETE", "/sessions/" + confirmCancel, null, localStorage.getItem("auth-key"))
      .then(response => {
        if (response.status == 200) getSessions();
        else setStatus(response.body.message);
      })
      .catch(error => setStatus(String(error)));
    setConfirmCancel(null);
  }, [confirmCancel, getSessions]);

  return (
    <section className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-3xl font-bold self-start">
        {user && user.role === "trainer" ? "My Sessions" : "Timetable"}
      </h1>

      {!status && sessions.length === 0 && (
        <span className="loading loading-spinner loading-xl mt-8"></span>
      )}
      {status && <span className="text-error">{status}</span>}

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

            {/* Book button - members only */}
            {user && user.role === "member" && (
              <button
                onClick={() => navigate("/bookings/create/" + session.id)}
                disabled={session.bookedCount >= session.maxParticipants}
                className="btn btn-primary btn-sm">
                {session.bookedCount >= session.maxParticipants ? "Full" : "Book"}
              </button>
            )}

            {/* Cancel button - trainers only on their own sessions */}
            {user && user.role === "trainer" && session.trainerId == user.id && (
              <button onClick={() => askCancelSession(session.id)}
                className="btn btn-error btn-sm">Cancel</button>
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
              Are you sure you want to cancel this session? All member bookings for this session will be affected.
            </p>
            <div className="modal-action">
              <button onClick={() => setConfirmCancel(null)} className="btn btn-ghost">Keep Session</button>
              <button onClick={confirmCancelSession} className="btn btn-error">Cancel Session</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setConfirmCancel(null)}></div>
        </div>
      )}
    </section>
  );
}

export default TimetableView;
