import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchAPI } from "../api.mjs";
import { useNavigate } from "react-router";

export const AuthenticationContext = createContext(null);

export function AuthenticationProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [status, setStatus] = useState("resuming");

  useEffect(() => {
    const authenticationKey = localStorage.getItem("auth-key");
    if (authenticationKey) {
      fetchAPI("GET", "/users/self", null, authenticationKey)
        .then((response) => {
          if (response.status == 200) {
            setUser(response.body);
            setStatus("loaded");
          } else {
            localStorage.removeItem("auth-key");
            setStatus("logged out");
          }
        })
        .catch(() => {
          localStorage.removeItem("auth-key");
          setStatus("logged out");
        });
    } else {
      setStatus("logged out");
    }
  }, []);

  return (
    <AuthenticationContext.Provider value={[user, setUser, status, setStatus]}>
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthenticate(restrictToRoles = null) {
  const [user, setUser, status, setStatus] = useContext(AuthenticationContext);
  const navigate = useNavigate();

  const getUser = useCallback(
    (authenticationKey) => {
      if (authenticationKey) {
        setStatus("loading");
        fetchAPI("GET", "/users/self", null, authenticationKey)
          .then((response) => {
            if (response.status == 200) {
              setUser(response.body);
              setStatus("loaded");
            } else {
              setStatus(response.body.message);
            }
          })
          .catch((error) => setStatus(String(error)));
      }
    },
    [setUser, setStatus],
  );

  const login = useCallback(
    (email, password) => {
      setStatus("authenticating");
      fetchAPI("POST", "/authenticate", { email, password })
        .then((response) => {
          if (response.status == 200) {
            localStorage.setItem("auth-key", response.body.authenticationKey);
            getUser(response.body.authenticationKey);
            setStatus("loaded");
          } else {
            setStatus(response.body.message);
          }
        })
        .catch((error) => setStatus(String(error)));
    },
    [setStatus, getUser],
  );

  // Logout — clears server key, clears local state, redirects to /login
  const logout = useCallback(() => {
    const authKey = localStorage.getItem("auth-key");
    fetchAPI("DELETE", "/authenticate", null, authKey).then(() => {
      setUser(null);
      localStorage.removeItem("auth-key");
      setStatus("logged out");
      navigate("/login"); // ← redirect to login after logout
    });
  }, [setUser, setStatus, navigate]);

  const refresh = useCallback(() => {
    const authKey = localStorage.getItem("auth-key");
    if (authKey) getUser(authKey);
  }, [getUser]);

  // Role restriction — redirect to /login if not authorised
  useEffect(() => {
    if (
      restrictToRoles &&
      status !== "resuming" &&
      (!user || !restrictToRoles.includes(user.role))
    ) {
      navigate("/login");
    }
  }, [user, status, restrictToRoles, navigate]);

  return { user, login, logout, refresh, status };
}
