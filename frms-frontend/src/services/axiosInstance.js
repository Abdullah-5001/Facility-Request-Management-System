import axios from "axios";

const DEFAULT_API_BASE_URL = "http://localhost:5257/api";

const normalizeBaseUrl = (value) => {
  const raw = (value || "").trim();
  if (!raw) return DEFAULT_API_BASE_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
};

const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL,
);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const clearAuthAndRedirect = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname || "";
  if (currentPath.startsWith("/login")) return;

  window.location.assign("/login");
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    const isAuthRequest =
      typeof url === "string" &&
      (url.includes("/auth/login") || url.includes("/auth/register"));

    if (!isAuthRequest && (status === 401 || status === 403)) {
      clearAuthAndRedirect();
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
