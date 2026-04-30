import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  LayoutDashboard,
  PlusCircle,
  History,
  User,
  LogOut,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  X,
  Sparkles,
  Eye,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { ticketService } from "../services/ticketService";
import { usePageTitle } from "../hooks/usePageTitle";
import TicketSubmissionModal from "../components/TicketSubmissionModal";

const ticketIdLabel = (requestID) => `REQ-${requestID}`;

const statusLabel = (status) => (status === "Completed" ? "Resolved" : status);

const statusTone = (status) => {
  const label = statusLabel(status);
  if (label === "Resolved") {
    return {
      chip: "bg-green-100 text-green-700 border-green-200",
      icon: "text-green-500",
    };
  }

  if (label === "In Progress") {
    return {
      chip: "bg-blue-100 text-blue-700 border-blue-200",
      icon: "text-blue-500",
    };
  }

  return {
    chip: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "text-amber-500",
  };
};

const priorityTone = (priority) => {
  const value = (priority || "").toLowerCase();
  if (value === "high") return "bg-red-100 text-red-700 border-red-200";
  if (value === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
  if (value === "low") return "bg-green-100 text-green-700 border-green-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const sortByNewest = (a, b) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const initialsFromName = (name) => {
  const value = (name || "").trim();
  if (!value) return "R";
  const parts = value.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export default function RequestorDashboardEnhanced() {
  usePageTitle("My Dashboard");

  const { user, logout, isAuthenticated } = useAuth();

  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeView, setActiveView] = useState("overview");

  const fetchMyTickets = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");
    try {
      const tickets = await ticketService.getMyRequests();
      setMyTickets(tickets);
    } catch (e) {
      console.error(e);
      setMyTickets([]);
      setError(e?.message || "Failed to load your tickets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let intervalId;

    (async () => {
      await fetchMyTickets();
      intervalId = setInterval(() => {
        fetchMyTickets({ silent: true }).catch(() => {});
      }, 15000);
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const ticketsSorted = useMemo(
    () => [...myTickets].sort(sortByNewest),
    [myTickets],
  );

  const stats = useMemo(() => {
    const total = myTickets.length;
    const active = myTickets.filter((t) =>
      ["Pending", "Approved", "In Progress"].includes(t.status),
    ).length;
    const resolved = myTickets.filter((t) => t.status === "Completed").length;
    const pending = myTickets.filter((t) => t.status === "Pending").length;

    return { total, active, resolved, pending };
  }, [myTickets]);

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ticketsSorted.filter((ticket) => {
      const status = statusLabel(ticket.status);
      const idText = ticketIdLabel(ticket.requestID).toLowerCase();
      const titleText = (ticket.title || "").toLowerCase();
      const locationText = (ticket.location || "").toLowerCase();
      const notesText = (ticket.description || "").toLowerCase();
      const matchesStatus = statusFilter === "All" || status === statusFilter;

      if (!matchesStatus) return false;
      if (!q) return true;

      return (
        idText.includes(q) ||
        titleText.includes(q) ||
        locationText.includes(q) ||
        notesText.includes(q)
      );
    });
  }, [query, statusFilter, ticketsSorted]);

  const recentActivity = useMemo(
    () => ticketsSorted.slice(0, 4),
    [ticketsSorted],
  );

  const notifications = useMemo(
    () =>
      ticketsSorted
        .filter((ticket) => ticket.status !== "Completed")
        .slice(0, 4),
    [ticketsSorted],
  );

  const currentViewCopy = {
    overview: {
      title: "Track requests and submit new issues quickly.",
      subtitle:
        "Use the dashboard to follow the full lifecycle of your requests from submission through resolution.",
    },
    history: {
      title: "Review the requests that have already been resolved.",
      subtitle:
        "Filter by status to audit your request history, reopen context, or submit a follow-up ticket.",
    },
    profile: {
      title: "Keep your profile and request history in one place.",
      subtitle:
        "Your account information, request volume, and notification summary are available here.",
    },
  }[activeView];

  const handleNavigate = (target) => {
    if (target === "submit") {
      setActiveView("overview");
      setIsModalOpen(true);
      return;
    }

    if (target === "history") {
      setActiveView("history");
      setStatusFilter("Completed");
      return;
    }

    if (target === "overview") {
      setActiveView("overview");
      setStatusFilter("All");
      return;
    }

    if (target === "profile") {
      setActiveView("profile");
      setIsProfileOpen(true);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div
      className="flex h-screen bg-[#F8F9FA]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <aside className="hidden w-72 flex-col border-r border-white/10 bg-[#0B2545] text-white shadow-2xl md:flex">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F26419] shadow-lg shadow-orange-950/30">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">PTUT FRMS</h2>
              <p className="text-sm text-blue-200">Requestor Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <button
            type="button"
            onClick={() => handleNavigate("overview")}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
              activeView === "overview"
                ? "bg-[#F26419] text-white shadow-lg shadow-orange-950/20"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <LayoutDashboard size={18} /> Overview
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("submit")}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-gray-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            <PlusCircle size={18} /> Submit New Request
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("history")}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
              activeView === "history"
                ? "bg-white/10 text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <History size={18} /> Ticket History
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("profile")}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
              activeView === "profile"
                ? "bg-white/10 text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <User size={18} /> My Profile
          </button>
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-300 transition-all duration-200 hover:bg-white/10 hover:text-red-300"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="z-10 border-b border-gray-100 bg-white/90 px-4 py-4 shadow-sm backdrop-blur md:px-8">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
            <div className="min-w-0 max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#F26419]">
                <Sparkles size={14} /> Requestor Workspace
              </div>
              <h1 className="mt-2 max-w-xl text-2xl font-bold leading-tight text-[#0B2545] sm:text-3xl lg:text-4xl xl:text-[2.65rem]">
                Welcome back, {user?.name || "Requestor"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 lg:text-base">
                {currentViewCopy.title}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#F26419] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d95714]"
                >
                  <PlusCircle size={18} /> Create Ticket
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate("history")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50"
                >
                  <History size={18} /> View History
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:min-w-xl">
              <div className="relative w-full">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tickets, locations, or notes..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[#F26419]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchMyTickets({ silent: true })}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((v) => !v)}
                  className="relative inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[#0B2545] transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {stats.pending > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F26419] px-1 text-[11px] font-bold text-white">
                      {stats.pending}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-left transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
                >
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-[#0B2545]">
                      {user?.name || "Requestor"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || "PTUT email"}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2545] text-sm font-bold text-white">
                    {initialsFromName(user?.name)}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mb-8 overflow-hidden rounded-3xl bg-linear-to-r from-[#0B2545] via-[#0E3764] to-[#123d6d] p-6 text-white shadow-2xl shadow-slate-900/10 md:p-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold md:text-3xl">
                  Notice a facility issue on campus?
                </h2>
                <p className="mt-3 text-sm leading-6 text-blue-100 md:text-base">
                  {currentViewCopy.subtitle}
                </p>
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-3 xl:w-lg xl:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-100">
                    Total
                  </p>
                  <p className="mt-2 text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-100">
                    Active
                  </p>
                  <p className="mt-2 text-3xl font-bold">{stats.active}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-100">
                    Resolved
                  </p>
                  <p className="mt-2 text-3xl font-bold">{stats.resolved}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-4 md:grid-cols-4">
            {[
              {
                label: "Submitted",
                value: stats.total,
                icon: LayoutDashboard,
                tone: "bg-blue-50 text-blue-600",
              },
              {
                label: "Pending",
                value: stats.pending,
                icon: Clock,
                tone: "bg-amber-50 text-amber-600",
              },
              {
                label: "Active",
                value: stats.active,
                icon: AlertCircle,
                tone: "bg-red-50 text-red-600",
              },
              {
                label: "Resolved",
                value: stats.resolved,
                icon: CheckCircle,
                tone: "bg-green-50 text-green-600",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}
                >
                  <card.icon size={22} />
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">
                    {card.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-[#0B2545]">
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0B2545]">
                Ticket Filters
              </h3>
              <p className="text-sm text-gray-500">
                Filter by request status and search the latest updates.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-2xl bg-gray-100 p-1">
                {[
                  "All",
                  "Pending",
                  "Approved",
                  "In Progress",
                  "Completed",
                  "Rejected",
                ].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                      statusFilter === status
                        ? "bg-white text-[#0B2545] shadow-sm"
                        : "text-gray-500 hover:text-[#0B2545]"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStatusFilter("All")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50"
              >
                <Filter size={16} /> Reset filter
              </button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0B2545]">
                    My Recent Requests
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Click any row to open the full ticket detail drawer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchMyTickets({ silent: true })}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Sync now
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-6">
                      <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
                      <div className="mt-4 h-20 animate-pulse rounded-2xl bg-gray-100" />
                    </div>
                  ))
                ) : filteredTickets.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      <Clock size={28} />
                    </div>
                    <h4 className="mt-4 text-lg font-bold text-[#0B2545]">
                      {statusFilter === "Completed"
                        ? "No resolved requests yet"
                        : "No matching requests"}
                    </h4>
                    <p className="mt-2 text-sm text-gray-500">
                      {query.trim()
                        ? "Try a different keyword or clear the search filter."
                        : statusFilter === "Completed"
                          ? "Your resolved requests will appear here once they are closed."
                          : "No tickets are available right now."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#F26419] px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#d95714]"
                    >
                      <PlusCircle size={18} /> Submit a new request
                    </button>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => {
                    const tone = statusTone(ticket.status);
                    const priorityClass = priorityTone(ticket.priority);
                    const label = statusLabel(ticket.status);

                    return (
                      <button
                        key={ticket.requestID}
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className="w-full border-b border-gray-100 p-6 text-left transition-all duration-200 last:border-b-0 hover:bg-gray-50"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <div className={`mt-1 shrink-0 ${tone.icon}`}>
                              {label === "Resolved" ? (
                                <CheckCircle size={22} />
                              ) : (
                                <Clock size={22} />
                              )}
                            </div>
                            {ticket.issueImageUrl ? (
                              <img
                                src={ticket.issueImageUrl}
                                alt="Attached issue"
                                className="h-16 w-16 shrink-0 rounded-2xl border border-gray-200 object-cover"
                                loading="lazy"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-bold ${tone.chip}`}
                                >
                                  {label}
                                </span>
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityClass}`}
                                >
                                  {ticket.priority || "Normal"}
                                </span>
                                <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                                  {ticketIdLabel(ticket.requestID)}
                                </span>
                              </div>
                              <h4 className="mt-3 truncate text-lg font-bold text-[#0B2545]">
                                {ticket.title}
                              </h4>
                              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                {ticket.description ||
                                  "No additional notes were provided."}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin
                                    size={14}
                                    className="text-[#F26419]"
                                  />
                                  {ticket.location || "Location unavailable"}
                                </span>
                                <span>
                                  Submitted{" "}
                                  {new Date(
                                    ticket.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 lg:justify-end">
                            <div className="text-right text-sm text-gray-500">
                              <div className="font-semibold text-[#0B2545]">
                                {ticket.departmentName || "Department"}
                              </div>
                              <div>
                                {ticket.status === "Completed"
                                  ? "Closed"
                                  : "Open"}{" "}
                                request
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#123d6d]">
                              View <Eye size={16} />
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#0B2545]">
                      Activity Snapshot
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Recent request updates and history.
                    </p>
                  </div>
                  <History className="text-[#F26419]" size={20} />
                </div>
                <div className="mt-5 space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                      No activity yet.
                    </div>
                  ) : (
                    recentActivity.map((ticket) => {
                      const tone = statusTone(ticket.status);
                      return (
                        <button
                          key={ticket.requestID}
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="flex w-full items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition-all duration-200 hover:border-gray-200 hover:bg-white"
                        >
                          <div className={`mt-1 ${tone.icon}`}>
                            <Clock size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-sm font-semibold text-[#0B2545]">
                                {ticket.title}
                              </p>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone.chip}`}
                              >
                                {statusLabel(ticket.status)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {ticketIdLabel(ticket.requestID)} •{" "}
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#0B2545]">
                  Quick Actions
                </h3>
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-2xl bg-[#F26419] px-4 py-3 text-left text-sm font-bold text-white transition-all duration-200 hover:bg-[#d95714]"
                  >
                    Submit another request
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate("history")}
                    className="rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50"
                  >
                    Review resolved tickets
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(true)}
                    className="rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50"
                  >
                    Open profile summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <TicketSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitted={() => {
          fetchMyTickets({ silent: true }).catch(() => {});
        }}
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
                  Recent notifications
                </h4>
                <p className="text-xs text-gray-500">
                  Active or pending requests only.
                </p>
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
              {notifications.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                  No active notifications.
                </div>
              ) : (
                notifications.map((ticket) => {
                  const tone = statusTone(ticket.status);
                  return (
                    <button
                      key={ticket.requestID}
                      type="button"
                      onClick={() => setSelectedTicket(ticket)}
                      className="flex w-full items-start gap-3 rounded-2xl bg-gray-50 p-3 text-left transition-all duration-200 hover:bg-white"
                    >
                      <div className={`mt-1 ${tone.icon}`}>
                        <AlertCircle size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0B2545]">
                          {ticket.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {ticketIdLabel(ticket.requestID)} •{" "}
                          {statusLabel(ticket.status)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setIsProfileOpen(false)}
          >
            <motion.div
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-gray-100 bg-[#0B2545] px-6 py-5 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-200">
                    Profile
                  </p>
                  <h3 className="mt-1 text-2xl font-bold">
                    {user?.name || "Requestor"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close profile"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-auto p-6">
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B2545] text-lg font-bold text-white">
                      {initialsFromName(user?.name)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#0B2545]">
                        {user?.name || "Requestor"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user?.email || "No email available"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Total
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#0B2545]">
                      {stats.total}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Pending
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#0B2545]">
                      {stats.pending}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Resolved
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#0B2545]">
                      {stats.resolved}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                    Help
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    Need to submit a new issue or follow up on an active
                    request? Use the buttons below to keep the workflow moving.
                  </p>
                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsModalOpen(true);
                      }}
                      className="w-full rounded-2xl bg-[#F26419] px-4 py-3 text-left text-sm font-bold text-white transition-all duration-200 hover:bg-[#d95714]"
                    >
                      Submit new request
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleNavigate("history");
                      }}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-[#0B2545] transition-all duration-200 hover:bg-gray-50"
                    >
                      View history
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-4xl rounded-t-4xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Ticket detail
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-[#0B2545]">
                    {selectedTicket.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {ticketIdLabel(selectedTicket.requestID)} •{" "}
                    {new Date(selectedTicket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close ticket detail"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5">
                  {selectedTicket.issueImageUrl ? (
                    <img
                      src={selectedTicket.issueImageUrl}
                      alt="Attached issue"
                      className="h-64 w-full rounded-3xl border border-gray-200 object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                      Description
                    </h4>
                    <p className="mt-3 text-sm leading-6 text-gray-700">
                      {selectedTicket.description ||
                        "No additional issue notes were provided."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    ["Status", statusLabel(selectedTicket.status)],
                    ["Priority", selectedTicket.priority || "Normal"],
                    [
                      "Department",
                      selectedTicket.departmentName || "Requestor portal",
                    ],
                    ["Location", selectedTicket.location || "Unknown"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        {label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#0B2545]">
                        {value}
                      </p>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(true);
                      setSelectedTicket(null);
                    }}
                    className="w-full rounded-2xl bg-[#F26419] px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#d95714]"
                  >
                    Create follow-up request
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
