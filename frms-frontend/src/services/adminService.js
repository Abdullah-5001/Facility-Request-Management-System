import axiosInstance from "./axiosInstance";

const USE_MOCK = (import.meta.env.VITE_USE_MOCK || "false") === "true";
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const mockUsers = [
  {
    userID: 9001,
    fullName: "Amina Hassan",
    email: "amina.hassan@ptut.edu.pk",
    role: "DeptHead",
    departmentID: 2,
    departmentName: "Estate Management",
    vendorID: null,
    vendorName: null,
  },
  {
    userID: 9002,
    fullName: "Maqsood Ali",
    email: "maqsood.ali@vendor.test",
    role: "Vendor",
    departmentID: null,
    departmentName: null,
    vendorID: 1,
    vendorName: "Campus Repairs Co.",
  },
];

const mockLogs = [
  {
    logID: 1,
    requestID: 1002,
    ticketTitle: "Aircon not cooling",
    departmentName: "Library",
    vendorName: "Campus Repairs Co.",
    oldStatus: "Approved",
    newStatus: "In Progress",
    comments: "Assigned vendor 1",
    changedDate: new Date().toISOString(),
    changedByName: "System Admin",
    changedByRole: "Admin",
  },
  {
    logID: 2,
    requestID: 1001,
    ticketTitle: "Broken water tap in Block A",
    departmentName: "Facilities - Admin",
    vendorName: null,
    oldStatus: null,
    newStatus: "Pending",
    comments: "Ticket created",
    changedDate: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    changedByName: "Muhammad Abdullah Mahmood",
    changedByRole: "Requester",
  },
];

const mapApiError = (error, fallbackMessage) => {
  const data = error?.response?.data;
  const message =
    (typeof data === "string" && data.trim()) ||
    data?.message ||
    data?.title ||
    fallbackMessage ||
    "Request failed.";
  const err = new Error(message);
  err.status = error?.response?.status;
  err.data = data;
  return err;
};

export const adminService = {
  getUsers: async (role) => {
    if (USE_MOCK) {
      await wait();
      const normalizedRole = (role || "").trim();
      return normalizedRole
        ? mockUsers.filter((user) => user.role === normalizedRole)
        : [...mockUsers];
    }

    try {
      const res = await axiosInstance.get("/admin/users", {
        params: role ? { role } : undefined,
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      throw mapApiError(error, "Failed to load users.");
    }
  },

  createUser: async ({
    fullName,
    email,
    password,
    role,
    departmentID,
    vendorID,
  }) => {
    if (USE_MOCK) {
      await wait();
      const created = {
        userID: Date.now(),
        fullName,
        email,
        role,
        departmentID: departmentID || null,
        departmentName:
          departmentID === 2
            ? "Estate Management"
            : departmentID === 1
              ? "IT Department"
              : departmentID === 3
                ? "Planning and Development"
                : null,
        vendorID: vendorID || null,
        vendorName: vendorID ? "Campus Repairs Co." : null,
      };
      mockUsers.unshift(created);
      return created;
    }

    try {
      const res = await axiosInstance.post("/admin/users", {
        fullName,
        email,
        password,
        role,
        departmentID,
        vendorID,
      });
      return res.data;
    } catch (error) {
      throw mapApiError(error, "Failed to create user.");
    }
  },

  getAuditLogs: async (limit = 50) => {
    if (USE_MOCK) {
      await wait();
      return mockLogs.slice(0, limit);
    }

    try {
      const res = await axiosInstance.get("/admin/audit-logs", {
        params: { limit },
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      throw mapApiError(error, "Failed to load audit logs.");
    }
  },
};
