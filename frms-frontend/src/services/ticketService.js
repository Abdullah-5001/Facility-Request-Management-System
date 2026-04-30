import axiosInstance from "./axiosInstance";

// Toggle mock mode with VITE_USE_MOCK=true in your Vite env, or set to true
// for local dev when the backend isn't running. When false, behavior
// falls back to real API calls via axiosInstance.
const USE_MOCK = (import.meta.env.VITE_USE_MOCK || "false") === "true";

const normalizeIssueImageUrl = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  const base = axiosInstance?.defaults?.baseURL;
  if (!base || typeof base !== "string") return raw;

  try {
    return new URL(raw, base).toString();
  } catch {
    return raw;
  }
};

const normalizeTicket = (ticket) => {
  if (!ticket || typeof ticket !== "object") return ticket;
  if (!ticket.issueImageUrl) return ticket;
  return {
    ...ticket,
    issueImageUrl: normalizeIssueImageUrl(ticket.issueImageUrl),
  };
};

const normalizeTicketList = (value) =>
  Array.isArray(value) ? value.map(normalizeTicket) : [];

const toApiError = (error, fallbackMessage) => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  const message =
    (typeof data === "string" && data.trim()) ||
    data?.message ||
    data?.title ||
    fallbackMessage ||
    "Request failed.";

  const err = new Error(message);
  err.status = status;
  err.data = data;
  return err;
};

// -------- Mock data and helpers (used when USE_MOCK=true) --------
let _mockNextId = 1001;
const nowIso = (offsetMs = 0) => new Date(Date.now() - offsetMs).toISOString();

const mockVendors = [
  { vendorID: 1, companyName: "Campus Repairs Co.", contactPerson: "Ali Khan", phoneNumber: "0400-111-222", email: "contact@campusrepairs.test" },
  { vendorID: 2, companyName: "BrightFix Ltd.", contactPerson: "Sara Ahmed", phoneNumber: "0400-333-444", email: "hello@brightfix.test" },
];

const mockTickets = [
  {
    requestID: _mockNextId++,
    requesterID: 201,
    departmentID: 10,
    departmentName: "Facilities - Admin",
    title: "Broken water tap in Block A",
    description: "Tap leaking heavily near block A restroom.",
    location: "Block A - Restroom",
    createdAt: nowIso(1000 * 60 * 60 * 24 * 2),
    status: "Pending",
    priority: "Medium",
    issueImageUrl: null,
  },
  {
    requestID: _mockNextId++,
    requesterID: 202,
    departmentID: 11,
    departmentName: "Library",
    title: "Aircon not cooling",
    description: "AC unit in reading hall 2 is warm.",
    location: "Library - Reading Hall 2",
    createdAt: nowIso(1000 * 60 * 60 * 6),
    status: "Approved",
    priority: "High",
    issueImageUrl: null,
  },
  {
    requestID: _mockNextId++,
    requesterID: 203,
    departmentID: 10,
    departmentName: "Facilities - Admin",
    title: "Flickering lights in corridor",
    description: "Lights flicker intermittently on the 3rd floor.",
    location: "3rd Floor Corridor",
    createdAt: nowIso(1000 * 60 * 60 * 48),
    status: "Completed",
    priority: "Low",
    issueImageUrl: null,
    completedAt: nowIso(1000 * 60 * 60 * 24),
  },
];

const mockDelay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const findMockTicket = (requestID) => mockTickets.find((t) => String(t.requestID) === String(requestID));

// Helper to get local user info from localStorage (AuthContext uses same storage)
const getLocalUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getLocalUserId = () => {
  const user = getLocalUser();
  return user?.userId || user?.id || null;
};

// ----------------- Public API -----------------
export const ticketService = {
  // --- Auth-adjacent helpers (needed for admin dispatch UI) ---
  getVendors: async () => {
    if (USE_MOCK) {
      await mockDelay();
      return [...mockVendors];
    }
    try {
      const res = await axiosInstance.get("/vendors");
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      throw toApiError(e, "Failed to load vendors.");
    }
  },

  createVendor: async ({ companyName, contactPerson, phoneNumber, email }) => {
    if (USE_MOCK) {
      await mockDelay();
      const v = { vendorID: mockVendors.length + 1, companyName, contactPerson, phoneNumber, email };
      mockVendors.push(v);
      return v;
    }
    try {
      const payload = {
        companyName,
        contactPerson: contactPerson || null,
        phoneNumber: phoneNumber || null,
        email: email || null,
      };
      const res = await axiosInstance.post("/vendors", payload);
      return res.data;
    } catch (e) {
      throw toApiError(e, "Failed to create vendor.");
    }
  },

  createVendorUser: async (vendorId, { fullName, email, password }) => {
    if (USE_MOCK) {
      await mockDelay();
      return { id: Date.now(), vendorId, fullName, email };
    }
    try {
      const res = await axiosInstance.post(`/vendors/${vendorId}/users`, {
        fullName,
        email,
        password,
      });
      return res.data;
    } catch (e) {
      throw toApiError(e, "Failed to create vendor user.");
    }
  },

  // --- Requestor flow ---
  createTicket: async ({ title, description, location, departmentID, departmentId, photo }) => {
    if (USE_MOCK) {
      await mockDelay(400);
      const effectiveDepartmentId = departmentID ?? departmentId ?? 99;
      const t = {
        requestID: _mockNextId++,
        requesterID: getLocalUserId() || 999,
        departmentID: effectiveDepartmentId,
        departmentName: `Dept ${effectiveDepartmentId}`,
        title: title || "(no title)",
        description: description || "",
        location: location || "Unknown",
        createdAt: nowIso(),
        status: "Pending",
        priority: "Medium",
        issueImageUrl: null,
      };
      mockTickets.push(t);
      return normalizeTicket(t);
    }
    try {
      const effectiveDepartmentId = departmentID ?? departmentId;

      const hasPhoto =
        typeof FormData !== "undefined" && (photo instanceof File || photo instanceof Blob);

      if (hasPhoto) {
        const form = new FormData();
        form.append("title", title ?? "");
        form.append("description", description ?? "");
        form.append("location", location ?? "");
        form.append("departmentID", String(effectiveDepartmentId ?? ""));
        form.append("photo", photo);

        const res = await axiosInstance.post("/tickets", form);
        return normalizeTicket(res.data);
      }

      const payload = {
        title,
        description,
        location,
        departmentID: effectiveDepartmentId,
      };

      const res = await axiosInstance.post("/tickets", payload);
      return normalizeTicket(res.data);
    } catch (e) {
      throw toApiError(e, "Failed to create ticket.");
    }
  },

  getMyRequests: async () => {
    if (USE_MOCK) {
      await mockDelay();
      const user = getLocalUser();
      const userId = user?.userId || user?.id;
      if (!userId) return mockTickets.slice(0, 3).map(normalizeTicket);
      return mockTickets.filter((t) => String(t.requesterID) === String(userId)).map(normalizeTicket);
    }
    try {
      const res = await axiosInstance.get("/tickets/my");
      return normalizeTicketList(res.data);
    } catch (e) {
      throw toApiError(e, "Failed to load your tickets.");
    }
  },

  // --- Department Head flow ---
  getDepartmentTickets: async ({ departmentId, status } = {}) => {
    if (USE_MOCK) {
      await mockDelay();
      if (!departmentId) throw new Error("Missing departmentId.");
      return mockTickets.filter((t) => String(t.departmentID) === String(departmentId) && (!status || t.status === status)).map(normalizeTicket);
    }
    try {
      if (!departmentId) {
        throw new Error("Missing departmentId.");
      }
      const res = await axiosInstance.get(
        `/tickets/department/${departmentId}`,
        status ? { params: { status } } : undefined,
      );
      return normalizeTicketList(res.data);
    } catch (e) {
      throw toApiError(e, "Failed to load department tickets.");
    }
  },

  updateTicketStatus: async (requestId, { status, comments } = {}) => {
    if (USE_MOCK) {
      await mockDelay();
      const t = findMockTicket(requestId);
      if (!t) throw new Error("Ticket not found");
      t.status = status;
      if (status === "Completed") t.completedAt = nowIso();
      return true;
    }
    try {
      await axiosInstance.put(`/tickets/${requestId}/status`, {
        status,
        comments,
      });
      return true;
    } catch (e) {
      throw toApiError(e, "Failed to update ticket status.");
    }
  },

  // --- Admin flow ---
  getApprovedTickets: async () => {
    if (USE_MOCK) {
      await mockDelay();
      return mockTickets.filter((t) => t.status === "Approved").map(normalizeTicket);
    }
    try {
      const res = await axiosInstance.get("/tickets", {
        params: { status: "Approved" },
      });
      return normalizeTicketList(res.data);
    } catch (e) {
      throw toApiError(e, "Failed to load approved tickets.");
    }
  },

  assignVendor: async (requestId, vendorId) => {
    if (USE_MOCK) {
      await mockDelay();
      const t = findMockTicket(requestId);
      if (!t) throw new Error("Ticket not found");
      t.vendorID = parseInt(vendorId, 10);
      t.status = "In Progress";
      return true;
    }
    try {
      await axiosInstance.put(`/tickets/${requestId}/assign-vendor`, {
        vendorID: parseInt(vendorId),
      });
      return true;
    } catch (e) {
      throw toApiError(e, "Failed to assign vendor.");
    }
  },

  // --- Vendor flow ---
  getVendorAssigned: async () => {
    if (USE_MOCK) {
      await mockDelay();
      const user = getLocalUser();
      if (!user) return [];
      // If user has vendorID, return tasks assigned to that vendor; otherwise return none
      const vendorId = user.vendorID || user.vendorId || null;
      if (!vendorId) return mockTickets.filter((t) => t.vendorID).map(normalizeTicket);
      return mockTickets.filter((t) => String(t.vendorID) === String(vendorId)).map(normalizeTicket);
    }
    try {
      const res = await axiosInstance.get("/tickets/my-assigned");
      return normalizeTicketList(res.data);
    } catch (e) {
      throw toApiError(e, "Failed to load assigned work orders.");
    }
  },

  resolveTicket: async (requestId, resolutionNotes) => {
    if (USE_MOCK) {
      await mockDelay(500);
      const t = findMockTicket(requestId);
      if (!t) throw new Error("Ticket not found");
      t.status = "Completed";
      t.completedAt = nowIso();
      t.resolutionNotes = resolutionNotes;
      return true;
    }
    try {
      await axiosInstance.put(`/tickets/${requestId}/complete`, {
        resolutionNotes,
      });
      return true;
    } catch (e) {
      throw toApiError(e, "Failed to resolve ticket.");
    }
  },
};

// Spec aliases (kept for clarity)
ticketService.getMyRequestsHistory = async () => ticketService.getMyRequests();
ticketService.getDepartmentPendingTickets = async (departmentId) =>
  ticketService.getDepartmentTickets({ departmentId, status: "Pending" });
ticketService.completeTicket = async (requestId, resolutionNotes) =>
  ticketService.resolveTicket(requestId, resolutionNotes);
