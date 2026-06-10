import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { fetchAPI } from "../api.mjs";
import { useAuthenticate } from "../authentication/useAuthenticate";

function TimetableView() {
  const navigate = useNavigate();
  const { user } = useAuthenticate();
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState(null);

  const getSessions = useCallback(() => {
    setSessions([]);
    setStatus(null);
    fetchAPI("GET", "/sessions")
      .then((response) => {
        if (response.status == 200) {
          setSessions(response.body);
        } else {
          setStatus(response.body.message);
        }
      })
      .catch((error) => setStatus(String(error)));
  }, []);

  useEffect(() => {
    getSessions();
  }, [getSessions]);

  return (
    <section className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-3xl font-bold self-start">Timetable</h1>

      {!status && sessions.length === 0 && (
        <span className="loading loading-spinner loading-xl mt-8"></span>
      )}
      {status && <span className="text-error">{status}</span>}

      <ul className="list self-stretch">
        {sessions.map((session) => (
          <li key={session.id} className="list-row items-center gap-4">
            <div className="flex flex-col grow">
              <span className="font-semibold">{session.activityName}</span>
              <span className="text-sm opacity-70">{session.trainerName}</span>
              <span className="text-xs opacity-50">
                {session.date} at {session.time?.slice(0, 5)}
              </span>
              <span className="text-xs opacity-50">
                {session.locationName} &bull; {session.durationMinutes} min
              </span>
              <span className="text-xs opacity-40">
                {session.bookedCount}/{session.maxParticipants} booked
              </span>
            </div>
            {user && user.role === "member" && (
              <button
                onClick={() => navigate("/bookings/create/" + session.id)}
                disabled={session.bookedCount >= session.maxParticipants}
                className="btn btn-primary btn-sm"
              >
                {session.bookedCount >= session.maxParticipants ? "Full" : "Book"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TimetableView;