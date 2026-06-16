import { useEffect } from "react";
import { FaDumbbell, FaCalendarAlt, FaBlog, FaUser } from "react-icons/fa";
import { TbLogout, TbLogin } from "react-icons/tb";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuthenticate } from "../authentication/useAuthenticate";

function Layout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthenticate();

  // Redirect to login on logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isTrainer = user && user.role === "trainer";
  const isMember  = user && user.role === "member";

  // Timetable label changes to "My Sessions" for trainers
  const timetableLabel = isTrainer ? "My Sessions" : "Timetable";

  return (
    <main className="max-w-[430px] min-h-screen mx-auto shadow">
      {/* Header */}
      <header className="navbar justify-between bg-base-100 shadow-md sticky top-0 z-10">
        <button onClick={() => navigate("/timetable")} className="btn btn-ghost text-lg font-bold">
          <FaDumbbell className="text-primary" /> High Street Gym
        </button>
        {user ? (
          <button onClick={handleLogout} className="btn btn-ghost text-lg text-error">
            <TbLogout />
          </button>
        ) : (
          <button onClick={() => navigate("/login")} className="btn btn-ghost text-lg text-success">
            <TbLogin />
          </button>
        )}
      </header>

      {/* Page content */}
      <div className="pb-20"><Outlet /></div>

      {/* Bottom dock nav */}
      <nav className="dock max-w-[430px] mx-auto">
        <button onClick={() => navigate("/timetable")}
          className={location.pathname === "/timetable" || location.pathname === "/" ? "dock-active" : ""}>
          <FaCalendarAlt className="text-2xl" />
          <span className="dock-label">{timetableLabel}</span>
        </button>

        <button onClick={() => navigate("/blog")}
          className={location.pathname.startsWith("/blog") ? "dock-active" : ""}>
          <FaBlog className="text-2xl" />
          <span className="dock-label">Blog</span>
        </button>

        {/* Bookings — hidden for trainers entirely */}
        {!isTrainer && (
          <button
            disabled={!isMember}
            onClick={() => navigate("/bookings")}
            className={location.pathname.startsWith("/bookings") ? "dock-active" : ""}>
            <FaDumbbell className="text-2xl" />
            <span className="dock-label">Bookings</span>
          </button>
        )}

        <button disabled={!user} onClick={() => navigate("/profile")}
          className={location.pathname.startsWith("/profile") ? "dock-active" : ""}>
          <FaUser className="text-2xl" />
          <span className="dock-label">Profile</span>
        </button>
      </nav>
    </main>
  );
}

export default Layout;
