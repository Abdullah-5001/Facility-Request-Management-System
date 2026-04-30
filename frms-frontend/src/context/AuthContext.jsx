import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

const TOKEN_KEY = "token";
const USER_KEY = "user";

const readStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const extractRole = (decoded) =>
  decoded?.role ||
  decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
  null;

const extractUserId = (decoded) => {
  const raw =
    decoded?.nameid ||
    decoded?.sub ||
    decoded?.[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ];
  const parsed = parseInt(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractName = (decoded) =>
  decoded?.unique_name ||
  decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
  null;

const extractEmail = (decoded) =>
  decoded?.email ||
  decoded?.[
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
  ] ||
  null;

const extractIntClaim = (decoded, key) => {
  const parsed = parseInt(decoded?.[key]);
  return Number.isFinite(parsed) ? parsed : null;
};

const decodeTokenToUser = (token) => {
  const decoded = jwtDecode(token);

  return {
    userId: extractUserId(decoded),
    name: extractName(decoded),
    email: extractEmail(decoded),
    role: extractRole(decoded),
    departmentId: extractIntClaim(decoded, "departmentId"),
    vendorId: extractIntClaim(decoded, "vendorId"),
    exp: decoded?.exp || null,
  };
};

const isTokenExpired = (decodedUser) => {
  if (!decodedUser?.exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return decodedUser.exp <= nowSeconds;
};

const dashboardPathForRole = (role) => {
  // You currently use a unified /dashboard router which renders role portals.
  // Keeping this switch makes it trivial to split into role-specific routes later.
  switch (role) {
    case "Admin":
    case "DeptHead":
    case "Requester":
    case "Vendor":
      return "/dashboard";
    default:
      return "/dashboard";
  }
};

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => readStoredUser());

  const isAuthenticated = !!token;

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const logout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const login = async (email, password) => {
    let data;
    try {
      data = await authService.login(email, password);
    } catch (e) {
      const apiMessage =
        (typeof e?.response?.data === "string" && e.response.data) ||
        e?.response?.data?.message;
      throw new Error(
        apiMessage || "Login failed. Please check your credentials.",
      );
    }

    const receivedToken = data?.Token || data?.token;
    if (!receivedToken)
      throw new Error("Login succeeded but no token was returned.");

    const decodedUser = decodeTokenToUser(receivedToken);

    localStorage.setItem(TOKEN_KEY, receivedToken);
    localStorage.setItem(USER_KEY, JSON.stringify(decodedUser));

    setToken(receivedToken);
    setUser(decodedUser);

    navigate(dashboardPathForRole(decodedUser.role), { replace: true });

    return decodedUser;
  };

  const register = async (payload) => {
    // Backend forces Role=Requester; we still send role for backward compatibility.
    try {
      return await authService.register(payload);
    } catch (e) {
      const apiMessage =
        (typeof e?.response?.data === "string" && e.response.data) ||
        e?.response?.data?.message;
      throw new Error(apiMessage || "Registration failed. Please try again.");
    }
  };

  useEffect(() => {
    if (!token) {
      if (location.pathname.startsWith("/dashboard")) {
        navigate("/login", { replace: true });
      }
      return;
    }

    try {
      const decodedUser = decodeTokenToUser(token);
      if (isTokenExpired(decodedUser)) {
        clearAuth();
        if (!location.pathname.startsWith("/login")) {
          navigate("/login", { replace: true });
        }
        return;
      }

      setUser(decodedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(decodedUser));
    } catch {
      clearAuth();
      if (!location.pathname.startsWith("/login")) {
        navigate("/login", { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || null,
      isAuthenticated,
      login,
      register,
      logout,
      dashboardPathForRole,
    }),
    [token, user, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
