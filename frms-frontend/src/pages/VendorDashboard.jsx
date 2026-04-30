import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Wrench,
  CheckSquare,
  ClipboardCheck,
  Clock,
  LogOut,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ticketService } from "../services/ticketService";
import { usePageTitle } from "../hooks/usePageTitle";

const ticketIdLabel = (requestID) => `REQ-${requestID}`;

const initialsFromName = (name) => {
  const safe = (name || "").trim();
  if (!safe) return "V";
  const parts = safe.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "V";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${second}`.toUpperCase();
};

const isSameLocalDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function VendorDashboard() {
  usePageTitle("Vendor");

  const { user, logout, isAuthenticated } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [activeView, setActiveView] = useState("active");
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAssigned = async () => {
    setError("");
    try {
      const data = await ticketService.getVendorAssigned();
      setTickets(data);
    } catch (e) {
      console.error(e);
      setTickets([]);
      setError(e?.message || "Failed to load assigned work orders.");
    }
  };

  useEffect(() => {
    let intervalId;
    (async () => {
      setLoading(true);
      await fetchAssigned();
      setLoading(false);
      intervalId = setInterval(fetchAssigned, 15000);
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lists = useMemo(() => {
    const completed = tickets
      .filter((t) => t.status === "Completed")
      .slice()
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.createdAt).getTime() -
          new Date(a.completedAt || a.createdAt).getTime(),
      );

    const active = tickets
      .filter((t) => t.status !== "Completed")
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return { active, completed };
  }, [tickets]);

  const stats = useMemo(() => {
    const pendingRepairs = lists.active.length;
    const now = new Date();

    const completedTodayTickets = lists.completed.filter((t) => {
      if (!t.completedAt) return false;
      return isSameLocalDay(new Date(t.completedAt), now);
    });

    const completedToday = completedTodayTickets.length;
    const avgHours = (() => {
      if (completedTodayTickets.length === 0) return null;
      const deltas = completedTodayTickets
        .map((t) => {
          if (!t.completedAt || !t.createdAt) return null;
          return (
            new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()
          );
        })
        .filter((ms) => typeof ms === "number" && ms >= 0);

      if (deltas.length === 0) return null;
      const avgMs = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      return avgMs / (1000 * 60 * 60);
    })();

    return {
      pendingRepairs,
      completedToday,
      avgHours,
    };
  }, [lists.active.length, lists.completed]);

  const bellCount = lists.active.length;

  const onSubmitCompletion = async (requestID) => {
    const notes = (resolutionNotes[requestID] || "").trim();
    if (!notes) {
      setError("Please enter resolution notes before submitting.");
      return;
    }

    setSubmittingId(requestID);
    setError("");
    try {
      await ticketService.resolveTicket(requestID, notes);
      setResolvingId(null);
      setResolutionNotes((p) => ({ ...p, [requestID]: "" }));
      await fetchAssigned();
    } catch (e) {
      console.error(e);
      setError(
        e?.message || e?.response?.data || "Failed to submit completion.",
      );
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isAuthenticated) return null;

  const shownTasks =
    activeView === "completed" ? lists.completed : lists.active;

  return (
    <div
      className="flex h-screen bg-[#F8F9FA]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0B2545] text-white flex flex-col shadow-xl hidden md:flex">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="text-[#F26419]" size={28} />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Vendor Portal
            </h2>
          </div>
          <p className="text-sm text-gray-400">PTUT Contractor Access</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            type="button"
            onClick={() => setActiveView("active")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeView === "active"
                ? "bg-[#F26419] text-white shadow-md"
                : "text-gray-300 hover:bg-white/10"
            }`}
          >
            <CheckSquare size={20} /> Active Work Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveView("completed")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeView === "completed"
                ? "bg-[#F26419] text-white shadow-md"
                : "text-gray-300 hover:bg-white/10"
            }`}
          >
            <ClipboardCheck size={20} /> Completed Tasks
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="flex items-center gap-3 text-gray-300 hover:text-red-400 w-full px-4 py-2 transition-colors"
          >
            <LogOut size={20} /> End Shift
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white shadow-sm flex items-center justify-end px-8 z-10">
          <div className="flex items-center gap-6">
            <button
              type="button"
              className="relative text-gray-500 hover:text-[#0B2545] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={24} />
              {bellCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F26419] text-white text-xs min-w-4 h-4 px-1 flex items-center justify-center rounded-full">
                  {bellCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-[#0B2545]">
                  {user?.name || "Vendor"}
                </p>
                <p className="text-xs text-gray-500">Registered Vendor</p>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-[#0B2545] font-bold">
                {initialsFromName(user?.name)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545]">
              {activeView === "completed"
                ? "Completed Tasks"
                : "Assigned Work Orders"}
            </h1>
            <p className="text-gray-500 mt-2">
              {activeView === "completed"
                ? "Review your completed work orders."
                : "View your dispatched tasks and update repair statuses."}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Pending Repairs
                </p>
                <p className="text-3xl font-bold text-[#0B2545]">
                  {stats.pendingRepairs}
                </p>
              </div>
              <Wrench className="text-blue-500 opacity-20" size={48} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Completed Today
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completedToday}
                </p>
              </div>
              <CheckCircle2 className="text-green-500 opacity-20" size={48} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Avg Resolution Time
                </p>
                <p className="text-3xl font-bold text-[#0B2545]">
                  {typeof stats.avgHours === "number"
                    ? `${stats.avgHours.toFixed(1)} hrs`
                    : "—"}
                </p>
              </div>
              <Clock className="text-amber-500 opacity-20" size={48} />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : shownTasks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-sm text-gray-500">
              {activeView === "completed"
                ? "No completed tasks yet."
                : "No assigned work orders right now."}
            </div>
          ) : (
            <div className="space-y-4">
              {shownTasks.map((task) => {
                const isCompleted = task.status === "Completed";
                const chipClass = isCompleted
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-700 border border-gray-200";

                const dispatchedDate = new Date(
                  task.createdAt,
                ).toLocaleDateString(undefined, {
                  month: "long",
                  day: "2-digit",
                });

                return (
                  <div
                    key={task.requestID}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Task Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${chipClass}`}
                          >
                            {isCompleted ? "Completed" : "Assigned"}
                          </span>
                          <span className="text-sm font-mono text-gray-500">
                            {ticketIdLabel(task.requestID)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-[#0B2545]">
                          {task.title}
                        </h3>
                        {task.issueImageUrl ? (
                          <a
                            href={task.issueImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-3"
                            aria-label="View attached issue photo"
                          >
                            <img
                              src={task.issueImageUrl}
                              alt="Attached issue"
                              className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                              loading="lazy"
                            />
                          </a>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin size={16} className="text-[#F26419]" />{" "}
                            {task.location}
                          </span>
                          <span>
                            Assigned by: {task.departmentName || "Admin"}
                          </span>
                          <span>Dispatched: {dispatchedDate}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {!isCompleted && (
                        <div>
                          {resolvingId === task.requestID ? (
                            <button
                              type="button"
                              onClick={() => setResolvingId(null)}
                              className="text-gray-500 hover:text-red-500 font-medium text-sm transition-colors"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setError("");
                                setResolvingId(task.requestID);
                              }}
                              className="bg-[#0B2545] hover:bg-blue-900 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md w-full md:w-auto"
                            >
                              <CheckSquare size={18} /> Resolve Task
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Resolution Form (Expands when button is clicked) */}
                    {!isCompleted && resolvingId === task.requestID && (
                      <div className="bg-gray-50 p-6 border-t border-gray-100">
                        <h4 className="font-bold text-[#0B2545] mb-3">
                          Mark Task as Completed
                        </h4>
                        <textarea
                          value={resolutionNotes[task.requestID] || ""}
                          onChange={(e) =>
                            setResolutionNotes((p) => ({
                              ...p,
                              [task.requestID]: e.target.value,
                            }))
                          }
                          placeholder="Enter detailed resolution notes (e.g., Replaced 2 valves, tested for leaks. All clear.)"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none text-sm min-h-[100px] mb-4"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={submittingId === task.requestID}
                            onClick={() => onSubmitCompletion(task.requestID)}
                            className="bg-[#F26419] disabled:opacity-60 hover:bg-[#d95714] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors"
                          >
                            Submit Completion &amp; Close Ticket
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
