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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ticketService } from "../services/ticketService";
import { usePageTitle } from "../hooks/usePageTitle";
import VendorCreationModal from "../components/VendorCreationModal";

const ticketIdLabel = (requestID) => `REQ-${requestID}`;

export default function AdminDashboard() {
  usePageTitle("Admin");

  const { user, logout, isAuthenticated } = useAuth();

  const [dispatchTickets, setDispatchTickets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorPick, setVendorPick] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);

  const fetchDispatchTickets = async () => {
    try {
      const data = await ticketService.getApprovedTickets();
      setDispatchTickets(data);
    } catch (e) {
      console.error(e);
      setDispatchTickets([]);
      throw e;
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await ticketService.getVendors();
      setVendors(data);
    } catch (e) {
      console.error(e);
      setVendors([]);
      throw e;
    }
  };

  useEffect(() => {
    let intervalId;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([fetchDispatchTickets(), fetchVendors()]);
      } catch {
        setError("Failed to load admin dispatch data.");
      } finally {
        setLoading(false);
      }

      intervalId = setInterval(() => {
        fetchDispatchTickets().catch(() => {});
      }, 15000);
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dispatchTickets;

    return dispatchTickets.filter((t) => {
      const idText = ticketIdLabel(t.requestID).toLowerCase();
      const deptText = (
        t.departmentName || `dept ${t.departmentID}`
      ).toLowerCase();
      const titleText = (t.title || "").toLowerCase();
      const locationText = (t.location || "").toLowerCase();
      return (
        idText.includes(q) ||
        deptText.includes(q) ||
        titleText.includes(q) ||
        locationText.includes(q)
      );
    });
  }, [dispatchTickets, query]);

  const stats = useMemo(() => {
    return {
      unassigned: dispatchTickets.length,
      activeVendors: vendors.length,
      inProgress: "—",
      uptime: "—",
    };
  }, [dispatchTickets.length, vendors.length]);

  const handleDispatch = async (requestID) => {
    setError("");
    const vendorID = vendorPick[requestID];
    if (!vendorID) {
      setError("Please select a vendor before dispatching.");
      return;
    }

    try {
      await ticketService.assignVendor(requestID, vendorID);
      await fetchDispatchTickets();
    } catch (e) {
      console.error(e);
      setError(e?.message || e?.response?.data || "Failed to dispatch ticket.");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div
      className="flex h-screen bg-[#F8F9FA]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0B2545] text-white shadow-xl hidden md:flex md:flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="text-[#F26419]" size={28} />
            <h2 className="text-2xl font-bold text-white">FRMS Admin</h2>
          </div>
          <p className="text-sm text-gray-400">System Control Center</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 bg-[#F26419] text-white px-4 py-3 rounded-lg font-medium shadow-md"
          >
            <LayoutDashboard size={20} /> System Overview
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 text-gray-300 hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Send size={20} /> Ticket Dispatch
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 text-gray-300 hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <HardHat size={20} /> Vendor Directory
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 text-gray-300 hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Users size={20} /> User Management
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 text-gray-300 hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <FileText size={20} /> Audit Logs
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
            <LogOut size={20} /> Secure Logout
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
              placeholder="Search Global Ticket ID..."
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
            </button>
            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-[#0B2545]">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500">Facilities Management</p>
              </div>
              <div className="w-10 h-10 bg-[#F26419] rounded-lg flex items-center justify-center text-white font-bold">
                {(user?.name || "SA")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0B2545]">
                University Operations
              </h1>
              <p className="text-gray-500 mt-2">
                Manage PTUT facility requests, vendor assignments, and users.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setIsAddVendorOpen(true);
                }}
                className="flex items-center gap-2 bg-[#0B2545] text-white px-5 py-2.5 rounded-lg shadow-md hover:opacity-95"
              >
                <PlusCircle size={18} /> Add Vendor
              </button>

              {/* Super Admin Action (UI only) */}
              <button
                type="button"
                disabled
                title="Not implemented"
                className="flex items-center gap-2 bg-[#0B2545] text-white px-5 py-2.5 rounded-lg shadow-md opacity-60 cursor-not-allowed"
              >
                <UserPlus size={18} /> Register Dept. Head
              </button>
            </div>
          </div>

          <VendorCreationModal
            isOpen={isAddVendorOpen}
            onClose={() => setIsAddVendorOpen(false)}
            onCreated={() => {
              fetchVendors().catch(() => {});
            }}
          />

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Global KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                label: "Unassigned Tickets",
                value: String(stats.unassigned),
                color: "text-red-500",
                border: "border-red-200",
              },
              {
                label: "Active Vendors",
                value: String(stats.activeVendors),
                color: "text-[#0B2545]",
                border: "border-blue-200",
              },
              {
                label: "In Progress Repairs",
                value: String(stats.inProgress),
                color: "text-amber-500",
                border: "border-amber-200",
              },
              {
                label: "System Uptime",
                value: String(stats.uptime),
                color: "text-green-500",
                border: "border-green-200",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`bg-white p-6 rounded-xl shadow-sm border-t-4 ${stat.border}`}
              >
                <p className="text-sm text-gray-500 font-medium mb-1">
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Dispatch Center Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#0B2545] flex items-center gap-2">
                  <Send size={20} className="text-[#F26419]" /> Dispatch Center
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Assign approved tickets to registered vendors.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-500 text-sm uppercase tracking-wider border-b">
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
                    filteredTickets
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .map((ticket) => (
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
                              Approved:{" "}
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </div>
                            {ticket.issueImageUrl ? (
                              <a
                                href={ticket.issueImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block mt-2"
                                aria-label="View attached issue photo"
                              >
                                <img
                                  src={ticket.issueImageUrl}
                                  alt="Attached issue"
                                  className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                                  loading="lazy"
                                />
                              </a>
                            ) : null}
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                              —
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={vendorPick[ticket.requestID] || ""}
                              onChange={(e) =>
                                setVendorPick((p) => ({
                                  ...p,
                                  [ticket.requestID]: e.target.value,
                                }))
                              }
                              className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-[#F26419] focus:border-[#F26419] block p-2"
                            >
                              <option value="">Select Vendor...</option>
                              {vendors.map((v) => (
                                <option key={v.vendorID} value={v.vendorID}>
                                  {v.companyName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDispatch(ticket.requestID)}
                              className="bg-[#F26419] hover:bg-[#d95714] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                              Dispatch
                            </button>
                          </td>
                        </tr>
                      ))
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
