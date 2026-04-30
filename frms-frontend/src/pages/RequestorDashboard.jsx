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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ticketService } from "../services/ticketService";
import { usePageTitle } from "../hooks/usePageTitle";
import TicketSubmissionModal from "../components/TicketSubmissionModal";

const ticketIdLabel = (requestID) => `REQ-${requestID}`;

const statusLabel = (status) => (status === "Completed" ? "Resolved" : status);

const statusIcon = (status) => {
  const label = statusLabel(status);
  if (label === "Resolved") return CheckCircle;
  if (label === "In Progress") return AlertCircle;
  return Clock;
};

const statusColorClass = (status) => {
  const label = statusLabel(status);
  if (label === "Resolved") return "text-green-500";
  if (label === "In Progress") return "text-blue-500";
  return "text-amber-500";
};

const statusPillClass = (status) => {
  const label = statusLabel(status);
  if (label === "Resolved") return "bg-green-100 text-green-700";
  if (label === "In Progress") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
};

export default function RequestorDashboard() {
  usePageTitle("My Dashboard");

  const { user, logout, isAuthenticated } = useAuth();

  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMyTickets = async () => {
    setError("");
    try {
      const tickets = await ticketService.getMyRequests();
      setMyTickets(tickets);
    } catch (e) {
      console.error(e);
      setMyTickets([]);
      setError(e?.message || "Failed to load your tickets.");
    }
  };

  useEffect(() => {
    let intervalId;
    (async () => {
      setLoading(true);
      await fetchMyTickets();
      setLoading(false);
      intervalId = setInterval(fetchMyTickets, 15000);
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = myTickets.length;
    const active = myTickets.filter((t) =>
      ["Pending", "Approved", "In Progress"].includes(t.status),
    ).length;
    const resolved = myTickets.filter((t) => t.status === "Completed").length;

    return { total, active, resolved };
  }, [myTickets]);

  const bellCount = myTickets.filter((t) => t.status === "Pending").length;

  if (!isAuthenticated) return null;

  return (
    <div
      className="flex h-screen bg-[#F8F9FA]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0B2545] text-white shadow-xl hidden md:flex md:flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white tracking-wide">
            PTUT FRMS
          </h2>
          <p className="text-sm text-gray-400 mt-1">Requestor Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 bg-[#F26419] text-white px-4 py-3 rounded-lg font-medium shadow-md"
          >
            <LayoutDashboard size={20} /> My Dashboard
          </a>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center gap-3 text-left text-gray-300 hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <PlusCircle size={20} /> Submit New Request
          </button>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 text-gray-300 hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <History size={20} /> Ticket History
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 text-gray-300 hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <User size={20} /> My Profile
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
          <div className="text-xl font-bold text-[#0B2545]">
            Welcome back, {user?.name || ""}!
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
                  {user?.name || "Requestor"}
                </p>
                <p className="text-xs text-gray-500">{user?.email || ""}</p>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-[#0B2545]">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* Hero Action Banner */}
          <div className="bg-[#0B2545] rounded-2xl p-8 mb-8 text-white shadow-lg flex justify-between items-center bg-opacity-95">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Notice a facility issue on campus?
              </h2>
              <p className="text-gray-300 max-w-lg">
                Help us keep PTUT running smoothly. Report broken equipment,
                plumbing, or IT issues immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-[#F26419] hover:bg-[#d95714] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-md"
            >
              <PlusCircle size={20} /> Create Ticket
            </button>
          </div>

          <TicketSubmissionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmitted={() => {
              fetchMyTickets();
            }}
          />

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Personal Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Submitted
                </p>
                <p className="text-2xl font-bold text-[#0B2545]">
                  {stats.total}
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Active / Pending
                </p>
                <p className="text-2xl font-bold text-[#0B2545]">
                  {stats.active}
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Resolved Issues
                </p>
                <p className="text-2xl font-bold text-[#0B2545]">
                  {stats.resolved}
                </p>
              </div>
            </div>
          </div>

          {/* My Tickets List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0B2545]">
                My Recent Requests
              </h2>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-[#F26419] text-sm font-semibold hover:underline flex items-center"
              >
                View All History <ChevronRight size={16} />
              </a>
            </div>
            <div className="p-0">
              {loading ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Loading...
                </div>
              ) : myTickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No tickets yet.
                </div>
              ) : (
                myTickets
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((ticket) => {
                    const Icon = statusIcon(ticket.status);
                    const label = statusLabel(ticket.status);
                    return (
                      <div
                        key={ticket.requestID}
                        className="p-6 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-1 ${statusColorClass(ticket.status)}`}
                          >
                            <Icon size={24} />
                          </div>
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
                            <h3 className="text-lg font-bold text-[#0B2545]">
                              {ticket.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin size={14} /> {ticket.location}
                              </span>
                              <span>•</span>
                              <span>
                                Submitted:{" "}
                                {new Date(ticket.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "long",
                                    day: "2-digit",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {ticketIdLabel(ticket.requestID)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${statusPillClass(ticket.status)}`}
                          >
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
