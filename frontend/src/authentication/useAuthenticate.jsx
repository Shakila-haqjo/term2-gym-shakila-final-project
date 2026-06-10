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
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("resuming");

  // Reload user state from auth key in local storage on page reload
  // Mirrors coffee project - calls GET /users/self with the stored key
  useEffect(() => {
    const authenticationKey = localStorage.getItem("auth-key");

    if (authenticationKey) {
      fetchAPI("GET", "/users/self", null, authenticationKey)
        .then((response) => {
          if (response.status == 200) {
            setUser(response.body);
            setStatus("loaded");
          } else {
            setStatus(response.body.message);
          }
        })
        .catch((error) => {
          setStatus(error);
        });
    } else {
      setStatus("logged out");
    }
  }, [setUser, setStatus]);

  return (
    <AuthenticationContext.Provider value={[user, setUser, status, setStatus]}>
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthenticate(restrictToRoles = null) {
  const [user, setUser, status, setStatus] = useContext(AuthenticationContext);

  // Load user data from the server using their authentication key
  // Mirrors coffee's getUser - calls GET /api/users/self
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
          .catch((error) => {
            setStatus(error);
          });
      }
    },
    [setUser, setStatus],
  );

  // Login with email and password
  // Calls POST /api/authenticate - mirrors coffee project exactly
  const login = useCallback(
    (email, password) => {
      const body = {
        email,
        password,
      };

      setStatus("authenticating");
      fetchAPI("POST", "/authenticate", body)
        .then((response) => {
          if (response.status == 200) {
            localStorage.setItem("auth-key", response.body.authenticationKey);
            // Load the user by their key
            getUser(response.body.authenticationKey);
            setStatus("loaded");
          } else {
            setStatus(response.body.message);
          }
        })
        .catch((error) => {
          setStatus(error);
        });
    },
    [setStatus, getUser],
  );

  // Logout - tells server to clear our key, clears state and localStorage
  // Mirrors coffee project's logout exactly
  const logout = useCallback(() => {
    const authKey = localStorage.getItem("auth-key");
    fetchAPI("DELETE", "/authenticate", null, authKey).then((response) => {
      setUser(null);
      localStorage.removeItem("auth-key");
      setStatus("logged out");
    });
  });

  // Refresh user data by re-requesting with the existing key
  const refresh = useCallback(() => {
    const authKey = localStorage.getItem("auth-key");
    if (authKey) getUser(authKey);
  }, [getUser]);

  const navigate = useNavigate();

  // Role restriction - redirect to /login if not authorized
  useEffect(() => {
    if (
      restrictToRoles &&
      status != "resuming" &&
      (!user || !restrictToRoles.includes(user.role))
    ) {
      navigate("/login");
    }
  }, [user, status, restrictToRoles, navigate]);

  return {
    user,
    login,
    logout,
    refresh,
    status,
  };
}
