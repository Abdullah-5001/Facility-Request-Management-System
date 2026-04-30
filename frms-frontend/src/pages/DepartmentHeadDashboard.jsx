import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Bell,
  LayoutDashboard,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  LogOut,
  User,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ticketService } from "../services/ticketService";
import { usePageTitle } from "../hooks/usePageTitle";

const normalizeStatusLabel = (status) =>
  status === "Completed" ? "Resolved" : status;

const ticketIdLabel = (requestID) => `REQ-${requestID}`;

export default function DepartmentHeadDashboard() {
  usePageTitle("Department Head");

  const { user, logout, isAuthenticated } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const fetchTickets = async () => {
    setError("");
    const departmentId = user?.departmentId;
    if (!departmentId) {
      setTickets([]);
      setError("Your account is missing a Department assignment.");
      return;
    }

    try {
      const data = await ticketService.getDepartmentTickets({ departmentId });
      setTickets(data);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load department tickets.");
      setTickets([]);
    }
  };

  useEffect(() => {
    let intervalId;
    (async () => {
      setLoading(true);
      await fetchTickets();
      setLoading(false);
      intervalId = setInterval(fetchTickets, 15000);
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.departmentId]);

  const handleUpdateStatus = async (requestID, status) => {
    setError("");
    try {
      await ticketService.updateTicketStatus(requestID, { status });
      await fetchTickets();
    } catch (e) {
      console.error(e);
      setError(
        e?.message || e?.response?.data || "Failed to update ticket status.",
      );
    }
  };

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;

    return tickets.filter((t) => {
      const idText = ticketIdLabel(t.requestID).toLowerCase();
      const requesterText = `requester #${t.requesterID}`.toLowerCase();
      const titleText = (t.title || "").toLowerCase();
      const locationText = (t.location || "").toLowerCase();

      return (
        idText.includes(q) ||
        requesterText.includes(q) ||
        titleText.includes(q) ||
        locationText.includes(q)
      );
    });
  }, [tickets, query]);

  const stats = useMemo(() => {
    const pending = tickets.filter((t) => t.status === "Pending").length;
    const approved = tickets.filter((t) => t.status === "Approved").length;

    const now = new Date();
    const resolvedThisWeek = tickets.filter((t) => {
      if (t.status !== "Completed") return false;
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      const diffDays = (now - completed) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length;

    return {
      pending,
      approved,
      resolvedThisWeek,
      urgent: 0,
    };
  }, [tickets]);

  const bellCount = stats.pending;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className="flex h-screen bg-[#F8F9FA]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0B2545] text-white flex-col shadow-xl hidden md:flex">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">PTUT FRMS</h2>
          <p className="text-sm text-gray-400 mt-1">Head Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 bg-[#F26419] text-white px-4 py-3 rounded-lg font-medium shadow-md"
          >
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 text-gray-300 hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Clock size={20} /> Pending Approvals
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 text-gray-300 hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <ClipboardList size={20} /> All Department Tickets
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 text-gray-300 hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <AlertTriangle size={20} /> Urgent Reports
          </a>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="flex items-center gap-3 text-gray-300 hover:text-red-400 w-full px-4 py-2 transition-colors"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 z-10">
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2 w-96 border border-gray-200">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Ticket ID or Requestor..."
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-gray-700"
            />
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              className="relative text-gray-500 hover:text-[#0B2545] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={24} />
              {bellCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-4 h-4 px-1 flex items-center justify-center rounded-full">
                  {bellCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-[#0B2545]">
                  {user?.name || "Department Head"}
                </p>
                <p className="text-xs text-gray-500">Head Portal</p>
              </div>
              <div className="w-10 h-10 bg-[#0B2545] rounded-full flex items-center justify-center text-white">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0B2545]">
                Department Overview
              </h1>
              <p className="text-gray-500 mt-2">
                Manage and approve maintenance requests for your department.
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm"
            >
              <Filter size={18} /> Filter view
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Stats KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                label: "Pending Approvals",
                value: String(stats.pending),
                icon: Clock,
                color: "text-amber-500",
                bg: "bg-amber-100",
              },
              {
                label: "Approved (Awaiting Fix)",
                value: String(stats.approved),
                icon: CheckCircle,
                color: "text-blue-500",
                bg: "bg-blue-100",
              },
              {
                label: "Resolved This Week",
                value: String(stats.resolvedThisWeek),
                icon: ClipboardList,
                color: "text-green-500",
                bg: "bg-green-100",
              },
              {
                label: "Urgent Requests",
                value: String(stats.urgent),
                icon: AlertTriangle,
                color: "text-red-500",
                bg: "bg-red-100",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg}`}
                >
                  <stat.icon size={24} className={stat.color} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#0B2545]">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tickets Table Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0B2545]">
                Recent Requests Requiring Action
              </h2>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-[#F26419] text-sm font-semibold hover:underline flex items-center"
              >
                View All <ChevronRight size={16} />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">Ticket ID</th>
                    <th className="p-4 font-medium">Requestor</th>
                    <th className="p-4 font-medium">Issue</th>
                    <th className="p-4 font-medium">Priority</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-sm text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-sm text-gray-500"
                      >
                        No tickets found.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .map((ticket) => {
                        const statusText = normalizeStatusLabel(ticket.status);
                        const priority = ticket.priority || "—";

                        const priorityClass =
                          priority === "High"
                            ? "bg-red-100 text-red-700"
                            : priority === "Medium"
                              ? "bg-amber-100 text-amber-700"
                              : priority === "Low"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-700";

                        const statusClass =
                          statusText === "Pending"
                            ? "bg-gray-200 text-gray-700"
                            : statusText === "Approved"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700";

                        return (
                          <tr
                            key={ticket.requestID}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-4 font-semibold text-[#0B2545]">
                              {ticketIdLabel(ticket.requestID)}
                            </td>
                            <td className="p-4 text-gray-700">
                              <div className="font-medium">
                                Requester #{ticket.requesterID}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(ticket.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "long",
                                    day: "2-digit",
                                    year: "numeric",
                                  },
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-start gap-3">
                                {ticket.issueImageUrl ? (
                                  <a
                                    href={ticket.issueImageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0"
                                    aria-label="View attached issue photo"
                                  >
                                    <img
                                      src={ticket.issueImageUrl}
                                      alt="Attached issue"
                                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : null}
                                <div>
                                  <div className="text-gray-800 font-medium">
                                    {ticket.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {ticket.location}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${priorityClass}`}
                              >
                                {priority}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass}`}
                              >
                                {statusText}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {ticket.status === "Pending" ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateStatus(
                                        ticket.requestID,
                                        "Approved",
                                      )
                                    }
                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle size={20} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateStatus(
                                        ticket.requestID,
                                        "Rejected",
                                      )
                                    }
                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle size={20} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="text-sm text-gray-500 hover:text-[#0B2545] font-medium underline"
                                >
                                  View Details
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
