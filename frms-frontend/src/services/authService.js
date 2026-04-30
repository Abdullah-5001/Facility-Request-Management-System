import axiosInstance from "./axiosInstance";

const USE_MOCK = (import.meta.env.VITE_USE_MOCK || "false") === "true";

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  login: async (email, password) => {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const safeEmail = typeof email === "string" ? email.trim() : "";
    if (!safeEmail) {
      throw new Error("Please enter your university email address.");
    }

    if (USE_MOCK) {
      await wait();
      return {
        message:
          "If an account exists for that email, a reset link would be sent.",
      };
    }

    try {
      const response = await axiosInstance.post("/auth/forgot-password", {
        email: safeEmail,
      });
      return response.data;
    } catch (error) {
      const status = error?.response?.status;
      if (status === 404 || status === 405) {
        await wait();
        return {
          message:
            "Password reset is not configured on the server yet. The request was accepted locally.",
        };
      }

      const apiMessage =
        (typeof error?.response?.data === "string" && error.response.data) ||
        error?.response?.data?.message;
      throw new Error(apiMessage || "Failed to request password reset.");
    }
  },
};
