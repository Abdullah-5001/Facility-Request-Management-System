import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Bell,
  LayoutDashboard,
  HardHat,
  Users,
  ShieldCheck,
  UserPlus,
  PlusCircle,
  LogOut,
  FileText,
  Send,
  Filter,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Building2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { ticketService } from "../services/ticketService";
import { adminService } from "../services/adminService";
import { usePageTitle } from "../hooks/usePageTitle";
import VendorCreationModal from "../components/VendorCreationModal";

const ticketIdLabel = (requestID) => `REQ-${requestID}`;

const departments = [
  { id: 1, name: "IT Department" },
  { id: 2, name: "Estate Management" },
  { id: 3, name: "Planning and Development" },
  { id: 4, name: "Academic Department" },
  { id: 5, name: "Quality (QAC) Department" },
  { id: 6, name: "Exam Department" },
];

const adminRoles = ["DeptHead", "Vendor", "Admin"];

const priorityTone = (priority) => {
  const value = (priority || "").toLowerCase();
  if (value === "high") return "bg-red-100 text-red-700 border-red-200";
  if (value === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
  if (value === "low") return "bg-green-100 text-green-700 border-green-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const initialsFromName = (name) => {
  const safe = (name || "").trim();
  if (!safe) return "SA";
  const parts = safe.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const statusBadgeClass = (status) => {
  if (status === "Pending") return "bg-amber-100 text-amber-700";
  if (status === "Approved") return "bg-blue-100 text-blue-700";
  if (status === "In Progress") return "bg-indigo-100 text-indigo-700";
  if (status === "Completed") return "bg-green-100 text-green-700";
  if (status === "Rejected") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

const tabButtonClass = (active) =>
  active
    ? "bg-[#F26419] text-white shadow-md"
    : "text-gray-300 hover:bg-white/10 hover:text-white";

export default function AdminDashboardEnhanced() {
  usePageTitle("Admin");

  const { user, logout, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [dispatchTickets, setDispatchTickets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [vendorPick, setVendorPick] = useState({});
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "DeptHead",
    departmentID: "",
    vendorID: "",
  });
  const [submittingUser, setSubmittingUser] = useState(false);
  const [dispatchSubmitting, setDispatchSubmitting] = useState({});

  const fetchAll = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");
    try {
      const [tickets, vendorList, userList, logs] = await Promise.all([
        ticketService.getApprovedTickets(),
        ticketService.getVendors(),
        adminService.getUsers(),
        adminService.getAuditLogs(50),
      ]);

      setDispatchTickets(tickets);
      setVendors(vendorList);
      setUsers(userList);
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let intervalId;

    (async () => {
      await fetchAll();
      intervalId = setInterval(() => {
        fetchAll({ silent: true }).catch(() => {});
      }, 15000);
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const stats = useMemo(() => {
    const pendingDispatch = dispatchTickets.length;
    const vendorCount = vendors.length;
    const deptHeads = users.filter((entry) => entry.role === "DeptHead").length;
    const activeLogs = auditLogs.length;

    return {
      pendingDispatch,
      vendorCount,
      deptHeads,
      activeLogs,
    };
  }, [dispatchTickets, vendors, users, auditLogs]);

  const bellCount = stats.pendingDispatch + Math.min(stats.activeLogs, 9);

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q)
      return dispatchTickets
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return dispatchTickets
      .filter((ticket) => {
        const idText = ticketIdLabel(ticket.requestID).toLowerCase();
        const deptText = (
          ticket.departmentName || `dept ${ticket.departmentID}`
        ).toLowerCase();
        const titleText = (ticket.title || "").toLowerCase();
        const locationText = (ticket.location || "").toLowerCase();
        return (
          idText.includes(q) ||
          deptText.includes(q) ||
          titleText.includes(q) ||
          locationText.includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [dispatchTickets, query]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((entry) => {
      const matchesRole = roleFilter === "All" || entry.role === roleFilter;
      if (!matchesRole) return false;
      if (!q) return true;
      return (
        (entry.fullName || "").toLowerCase().includes(q) ||
        (entry.email || "").toLowerCase().includes(q) ||
        (entry.role || "").toLowerCase().includes(q) ||
        (entry.departmentName || "").toLowerCase().includes(q) ||
        (entry.vendorName || "").toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, query]);

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditLogs.filter((entry) => {
      if (!q) return true;
      return (
        String(entry.requestID || "")
          .toLowerCase()
          .includes(q) ||
        (entry.ticketTitle || "").toLowerCase().includes(q) ||
        (entry.departmentName || "").toLowerCase().includes(q) ||
        (entry.changedByName || "").toLowerCase().includes(q) ||
        (entry.newStatus || "").toLowerCase().includes(q)
      );
    });
  }, [auditLogs, query]);

  const handleDispatch = async (requestID) => {
    setError("");
    const vendorID = vendorPick[requestID];
    if (!vendorID) {
      setError("Please select a vendor before dispatching.");
      return;
    }

    setDispatchSubmitting((current) => ({ ...current, [requestID]: true }));
    try {
      await ticketService.assignVendor(requestID, vendorID);
      await fetchAll({ silent: true });
      setVendorPick((current) => {
        const next = { ...current };
        delete next[requestID];
        return next;
      });
      setActiveTab("logs");
    } catch (e) {
      console.error(e);
      setError(e?.message || e?.response?.data || "Failed to dispatch ticket.");
    } finally {
      setDispatchSubmitting((current) => ({ ...current, [requestID]: false }));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !userForm.fullName.trim() ||
      !userForm.email.trim() ||
      !userForm.password.trim()
    ) {
      setError("Full name, email, and password are required.");
      return;
    }

    if (userForm.role === "DeptHead" && !userForm.departmentID) {
      setError("Please select a department for the department head.");
      return;
    }

    if (userForm.role === "Vendor" && !userForm.vendorID) {
      setError("Please select a vendor for the vendor user.");
      return;
    }

    setSubmittingUser(true);
    try {
      await adminService.createUser({
        fullName: userForm.fullName,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        departmentID: userForm.departmentID
          ? parseInt(userForm.departmentID, 10)
          : null,
        vendorID: userForm.vendorID ? parseInt(userForm.vendorID, 10) : null,
      });
      setIsCreateUserOpen(false);
      setUserForm({
        fullName: "",
        email: "",
        password: "",
        role: "DeptHead",
        departmentID: "",
        vendorID: "",
      });
      await fetchAll({ silent: true });
      setActiveTab("users");
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to create user.");
    } finally {
      setSubmittingUser(false);
    }
  };

  const recentNotifications = useMemo(() => {
    return [
      ...dispatchTickets.slice(0, 2).map((ticket) => ({
        id: `dispatch-${ticket.requestID}`,
        title: `Dispatch pending: ${ticket.title}`,
        subtitle: ticketIdLabel(ticket.requestID),
      })),
      ...auditLogs.slice(0, 3).map((entry) => ({
        id: `log-${entry.logID}`,
        title: `${entry.changedByName || "System"} updated ${entry.ticketTitle || "a ticket"}`,
        subtitle: `${entry.oldStatus || "New"} → ${entry.newStatus || "Updated"}`,
      })),
    ].slice(0, 5);
  }, [dispatchTickets, auditLogs]);

  if (!isAuthenticated) return null;

  const renderOverview = () => (
    <>
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Approved Dispatches",
            value: stats.pendingDispatch,
            icon: Send,
            tone: "text-red-500",
          },
          {
            label: "Active Vendors",
            value: stats.vendorCount,
            icon: HardHat,
            tone: "text-blue-500",
          },
          {
            label: "Department Heads",
            value: stats.deptHeads,
            icon: Users,
            tone: "text-amber-500",
          },
          {
            label: "Audit Entries",
            value: stats.activeLogs,
            icon: FileText,
            tone: "text-green-500",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 ${card.tone}`}
            >
              <card.icon size={22} />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">
              {card.label}
            </p>
            <p className="mt-1 text-3xl font-bold text-[#0B2545]">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#0B2545] flex items-center gap-2">
                <Send className="text-[#F26419]" size={20} /> Ticket Dispatch
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Assign approved tickets to registered vendors.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchAll({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Ticket / Dept</th>
                  <th className="p-4 font-medium">Issue Description</th>
                  <th className="p-4 font-medium">Priority</th>
                  <th className="p-4 font-medium">Assign Vendor</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-sm text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-sm text-gray-500"
                    >
                      No approved tickets to dispatch.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.requestID}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-[#0B2545]">
                          {ticketIdLabel(ticket.requestID)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.departmentName ||
                            `Dept ${ticket.departmentID}`}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-800 font-medium">
                          {ticket.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.location || "Location unavailable"}
                        </div>
                        {ticket.issueImageUrl ? (
                          <a
                            href={ticket.issueImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs font-semibold text-[#F26419] underline"
                          >
                            Open issue image
                          </a>
                        ) : null}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityTone(ticket.priority)}`}
                        >
                          {ticket.priority || "Normal"}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={vendorPick[ticket.requestID] || ""}
                          onChange={(e) =>
                            setVendorPick((current) => ({
                              ...current,
                              [ticket.requestID]: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[#F26419]"
                        >
                          <option value="">Select vendor...</option>
                          {vendors.map((vendor) => (
                            <option
                              key={vendor.vendorID}
                              value={vendor.vendorID}
                            >
                              {vendor.companyName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDispatch(ticket.requestID)}
                          disabled={dispatchSubmitting[ticket.requestID]}
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#F26419] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#d95714] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {dispatchSubmitting[ticket.requestID]
                            ? "Dispatching..."
                            : "Dispatch"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0B2545]">
              Activity Snapshot
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Current system status and quick actions.
            </p>
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => setIsAddVendorOpen(true)}
                className="rounded-2xl bg-[#0B2545] px-4 py-3 text-left text-sm font-bold text-white transition-all duration-200 hover:bg-[#123d6d]"
              >
                Add vendor
              </button>
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(true)}
                className="rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50"
              >
                Create department head
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className="rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50"
              >
                Open audit logs
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0B2545]">Notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              Recent dispatch and status updates.
            </p>
            <div className="mt-4 space-y-3">
              {recentNotifications.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                  No notifications right now.
                </div>
              ) : (
                recentNotifications.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-[#0B2545]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.subtitle}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );

  const renderUsers = () => (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0B2545]">
              User Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Search and review admin-created accounts.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setRoleFilter("All")}
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${roleFilter === "All" ? "bg-[#0B2545] text-white" : "border border-gray-200 text-[#0B2545] hover:bg-gray-50"}`}
            >
              All Roles
            </button>
            {adminRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${roleFilter === role ? "bg-[#0B2545] text-white" : "border border-gray-200 text-[#0B2545] hover:bg-gray-50"}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No matching users.
            </div>
          ) : (
            filteredUsers.map((entry) => (
              <div
                key={entry.userID}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B2545] text-sm font-bold text-white">
                      {initialsFromName(entry.fullName)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-[#0B2545]">
                          {entry.fullName}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(entry.role)}`}
                        >
                          {entry.role}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {entry.email}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {entry.departmentName
                          ? `Department: ${entry.departmentName}`
                          : "No department linked"}
                        {entry.vendorName
                          ? ` • Vendor: ${entry.vendorName}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <div>ID {entry.userID}</div>
                    <div>
                      {entry.vendorID ? `Vendor #${entry.vendorID}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0B2545]">Create User</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add a department head or vendor login.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateUserOpen(true)}
            className="mt-4 w-full rounded-2xl bg-[#F26419] px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#d95714]"
          >
            Open creation form
          </button>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0B2545]">Vendor Directory</h3>
          <div className="mt-4 space-y-3">
            {vendors.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                No vendors available yet.
              </div>
            ) : (
              vendors.map((vendor) => (
                <div
                  key={vendor.vendorID}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="font-semibold text-[#0B2545]">
                    {vendor.companyName}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Vendor ID {vendor.vendorID}
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsAddVendorOpen(true)}
            className="mt-4 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50"
          >
            Add vendor company
          </button>
        </div>
      </aside>
    </div>
  );

  const renderLogs = () => (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0B2545]">Audit Logs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Track request status transitions and admin actions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchAll({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh logs
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No audit entries found.
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <div
              key={entry.logID}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(entry.newStatus)}`}
                    >
                      {entry.oldStatus || "New"} →{" "}
                      {entry.newStatus || "Updated"}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                      {ticketIdLabel(entry.requestID)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-[#0B2545]">
                    {entry.ticketTitle || "Ticket activity"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {entry.departmentName || "Unknown department"}
                    {entry.vendorName ? ` • Vendor: ${entry.vendorName}` : ""}
                  </p>
                  <p className="mt-3 text-sm text-gray-600">
                    {entry.comments || "No comments provided."}
                  </p>
                </div>
                <div className="text-sm text-gray-500 lg:text-right">
                  <div className="font-semibold text-[#0B2545]">
                    {entry.changedByName || "System"}
                  </div>
                  <div>{entry.changedByRole || "Admin"}</div>
                  <div className="mt-1 flex items-center gap-1 lg:justify-end">
                    <Clock size={14} />{" "}
                    {entry.changedDate
                      ? new Date(entry.changedDate).toLocaleString()
                      : "Unknown time"}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );

  return (
    <div
      className="flex h-screen bg-[#F8F9FA]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <aside className="hidden w-64 flex-col bg-[#0B2545] text-white shadow-xl md:flex md:flex-col">
        <div className="border-b border-gray-700 p-6">
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="text-[#F26419]" size={28} />
            <h2 className="text-2xl font-bold text-white">FRMS Admin</h2>
          </div>
          <p className="text-sm text-gray-400">System Control Center</p>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-all duration-200 ${tabButtonClass(activeTab === "overview")}`}
          >
            <LayoutDashboard size={20} /> System Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dispatch")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-all duration-200 ${tabButtonClass(activeTab === "dispatch")}`}
          >
            <Send size={20} /> Ticket Dispatch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vendors")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-all duration-200 ${tabButtonClass(activeTab === "vendors")}`}
          >
            <HardHat size={20} /> Vendor Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-all duration-200 ${tabButtonClass(activeTab === "users")}`}
          >
            <Users size={20} /> User Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-all duration-200 ${tabButtonClass(activeTab === "logs")}`}
          >
            <FileText size={20} /> Audit Logs
          </button>
        </nav>

        <div className="border-t border-gray-700 p-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-2 text-gray-300 transition-colors hover:text-red-400"
          >
            <LogOut size={20} /> Secure Logout
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="z-10 border-b border-gray-100 bg-white px-4 py-4 shadow-sm md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F26419]">
                <Sparkles size={14} /> Admin workspace
              </div>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-[#0B2545]">
                University Operations
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-500 md:text-base">
                Manage PTUT facility requests, vendor assignments, users, and
                audit activity.
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:min-w-160">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tickets, users, vendors, or logs..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[#F26419]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchAll({ silent: true })}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((current) => !current)}
                  className="relative inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[#0B2545] transition-all duration-200 hover:bg-gray-50"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {bellCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F26419] px-1 text-[11px] font-bold text-white">
                      {bellCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0B2545] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#123d6d]"
                >
                  <PlusCircle size={16} /> Add Vendor
                </button>

                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#6b7280] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#4b5563]"
                >
                  <UserPlus size={16} /> Register Dept. Head
                </button>

                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-[#0B2545]">
                      {user?.name || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Facilities Management
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F26419] font-bold text-white">
                    {initialsFromName(user?.name)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {activeTab === "overview" && renderOverview()}
          {activeTab === "dispatch" && renderOverview()}
          {activeTab === "vendors" && (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-6">
                  <h2 className="text-xl font-bold text-[#0B2545]">
                    Vendor Directory
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Registered vendors available for dispatch.
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {vendors.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      No vendors available.
                    </div>
                  ) : (
                    vendors.map((vendor) => (
                      <div
                        key={vendor.vendorID}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-[#0B2545]">
                              {vendor.companyName}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Vendor ID {vendor.vendorID}
                            </p>
                          </div>
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            Active
                          </span>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                          {vendor.contactPerson ? (
                            <div>Contact: {vendor.contactPerson}</div>
                          ) : null}
                          {vendor.phoneNumber ? (
                            <div>Phone: {vendor.phoneNumber}</div>
                          ) : null}
                          {vendor.email ? (
                            <div>Email: {vendor.email}</div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0B2545]">
                    Vendor Actions
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a vendor company and login user.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddVendorOpen(true)}
                    className="mt-4 w-full rounded-2xl bg-[#F26419] px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#d95714]"
                  >
                    Open vendor modal
                  </button>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0B2545]">Status</h3>
                  <div className="mt-4 space-y-3 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Active vendors</span>
                      <span className="font-semibold text-[#0B2545]">
                        {stats.vendorCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dispatch tickets</span>
                      <span className="font-semibold text-[#0B2545]">
                        {stats.pendingDispatch}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Audit events</span>
                      <span className="font-semibold text-[#0B2545]">
                        {stats.activeLogs}
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
          {activeTab === "users" && renderUsers()}
          {activeTab === "logs" && renderLogs()}
        </div>
      </main>

      <VendorCreationModal
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        onCreated={() => fetchAll({ silent: true }).catch(() => {})}
      />

      <AnimatePresence>
        {isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed right-4 top-24 z-50 w-[min(92vw,24rem)] rounded-3xl border border-gray-100 bg-white p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-[#0B2545]">
                  Notifications
                </h4>
                <p className="text-xs text-gray-500">Recent admin activity</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(false)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {recentNotifications.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                  No notifications yet.
                </div>
              ) : (
                recentNotifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      if (item.subtitle?.startsWith("REQ-"))
                        setActiveTab("dispatch");
                    }}
                    className="flex w-full items-start gap-3 rounded-2xl bg-gray-50 p-3 text-left transition-all duration-200 hover:bg-white"
                  >
                    <div className="mt-1 text-[#F26419]">
                      <AlertCircle size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0B2545]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateUserOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between bg-[#0B2545] px-6 py-5 text-white">
                <div>
                  <p className="text-xs uppercase tracking-wider text-blue-200">
                    Create user
                  </p>
                  <h3 className="mt-1 text-2xl font-bold">
                    Department head or vendor login
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close creation modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-5 p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#0B2545]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={userForm.fullName}
                      onChange={(e) =>
                        setUserForm((current) => ({
                          ...current,
                          fullName: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[#F26419]"
                      placeholder="e.g. Engr. Ali Raza"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#0B2545]">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) =>
                        setUserForm((current) => ({
                          ...current,
                          email: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[#F26419]"
                      placeholder="staff@ptut.edu.pk"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#0B2545]">
                      Password
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm((current) => ({
                          ...current,
                          password: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[#F26419]"
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#0B2545]">
                      Role
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) =>
                        setUserForm((current) => ({
                          ...current,
                          role: e.target.value,
                          departmentID: "",
                          vendorID: "",
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[#F26419]"
                    >
                      {adminRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {userForm.role === "DeptHead" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#0B2545]">
                      Department
                    </label>
                    <select
                      value={userForm.departmentID}
                      onChange={(e) =>
                        setUserForm((current) => ({
                          ...current,
                          departmentID: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[#F26419]"
                      required
                    >
                      <option value="">Select department...</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {userForm.role === "Vendor" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#0B2545]">
                      Vendor
                    </label>
                    <select
                      value={userForm.vendorID}
                      onChange={(e) =>
                        setUserForm((current) => ({
                          ...current,
                          vendorID: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[#F26419]"
                      required
                    >
                      <option value="">Select vendor...</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.vendorID} value={vendor.vendorID}>
                          {vendor.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateUserOpen(false)}
                    className="w-1/3 rounded-xl px-5 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingUser}
                    className="w-2/3 rounded-xl bg-[#F26419] px-5 py-3 font-bold text-white shadow-md transition-all duration-200 hover:bg-[#d95714] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingUser ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
