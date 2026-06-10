import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "./common/Layout";
import LoginView from "./authentication/LoginView";
import RegisterView from "./authentication/RegisterView";
import TimetableView from "./timetable/TimetableView";
import BookingCheckoutView from "./bookings/BookingCheckoutView";
import BookingsView from "./bookings/BookingsView";
import BlogView from "./blog/BlogView";
import ProfileView from "./profile/ProfileView";
import { AuthenticationProvider } from "./authentication/useAuthenticate";

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        index: true,
        Component: TimetableView,
      },
      { path: "/timetable", Component: TimetableView },
      { path: "/login", Component: LoginView },
      { path: "/register", Component: RegisterView },
      { path: "/bookings", Component: BookingsView },
      { path: "/bookings/create/:sessionId", Component: BookingCheckoutView },
      { path: "/blog", Component: BlogView },
      { path: "/profile", Component: ProfileView },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthenticationProvider>
      <RouterProvider router={router} />
    </AuthenticationProvider>
  </StrictMode>,
);
