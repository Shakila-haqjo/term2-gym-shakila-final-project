import { FaDumbbell, FaCalendarAlt, FaBlog, FaUser } from "react-icons/fa";
import { TbLogout, TbLogin } from "react-icons/tb";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuthenticate } from "../authentication/useAuthenticate";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthenticate();

  return (
    <main className="max-w-[430px] min-h-screen mx-auto shadow">
      {/* Header - mirrors coffee project header */}
      <header className="navbar justify-between bg-base-100 shadow-md sticky top-0 z-10">
        <button
          onClick={() => navigate("/timetable")}
          className="btn btn-ghost text-lg font-bold"
        >
          <FaDumbbell className="text-primary" />
          High Street Gym
        </button>
        {user ? (
          <button onClick={() => logout()} className="btn btn-ghost text-lg">
            <TbLogout />
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="btn btn-ghost text-lg"
          >
            <TbLogin />
          </button>
        )}
      </header>

      {/* Page content - with bottom padding so nav doesn't overlap */}
      <div className="pb-20">
        <Outlet />
      </div>

      {/* Bottom dock nav - mirrors coffee project nav exactly */}
      <nav className="dock max-w-[430px] mx-auto">
        <button
          onClick={() => navigate("/timetable")}
          className={
            location.pathname == "/timetable" || location.pathname == "/"
              ? "dock-active"
              : ""
          }
        >
          <FaCalendarAlt className="text-2xl" />
          <span className="dock-label">Timetable</span>
        </button>

        <button
          onClick={() => navigate("/blog")}
          className={location.pathname.startsWith("/blog") ? "dock-active" : ""}
        >
          <FaBlog className="text-2xl" />
          <span className="dock-label">Blog</span>
        </button>

        {/* Bookings - only enabled for members (mirrors coffee's Orders button) */}
        <button
          disabled={!(user && user.role == "member")}
          onClick={() => navigate("/bookings")}
          className={
            location.pathname.startsWith("/bookings") ? "dock-active" : ""
          }
        >
          <FaDumbbell className="text-2xl" />
          <span className="dock-label">Bookings</span>
        </button>

        {/* Profile - only enabled when logged in */}
        <button
          disabled={!user}
          onClick={() => navigate("/profile")}
          className={
            location.pathname.startsWith("/profile") ? "dock-active" : ""
          }
        >
          <FaUser className="text-2xl" />
          <span className="dock-label">Profile</span>
        </button>
      </nav>
    </main>
  );
}

export default Layout;
