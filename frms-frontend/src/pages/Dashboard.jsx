import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Box,
  CircularProgress,
  Divider,
  Grid,
  Alert,
  TextField,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BusinessIcon from "@mui/icons-material/Business";
import { useAuth } from "../context/AuthContext";
import { ticketService } from "../services/ticketService";
import { usePageTitle } from "../hooks/usePageTitle";
import DepartmentHeadDashboard from "./DepartmentHeadDashboard";
import AdminDashboard from "./AdminDashboardEnhanced";
import RequestorDashboard from "./RequestorDashboardEnhanced";
import VendorDashboard from "./VendorDashboard";

const PTUT_GREEN = "#006838";

const statusColors = {
  Pending: "warning",
  Approved: "info",
  "In Progress": "primary",
  Completed: "success",
  Rejected: "error",
};

const statusLabel = (status) => (status === "Completed" ? "Resolved" : status);

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { user } = useAuth();
  const role = user?.role;

  if (role === "DeptHead") {
    return <DepartmentHeadDashboard />;
  }

  if (role === "Admin") {
    return <AdminDashboard />;
  }

  if (role === "Requester") {
    return <RequestorDashboard />;
  }

  if (role === "Vendor") {
    return <VendorDashboard />;
  }

  return <LegacyDashboard user={user} role={role} />;
}

function LegacyDashboard({ user, role }) {
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorPick, setVendorPick] = useState({});
  const [vendorNotes, setVendorNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canCreate = role === "Requester";

  const fetchRequests = async () => {
    setError("");
    try {
      if (role === "Requester") {
        const data = await ticketService.getMyRequests();
        setRequests(data);
      } else if (role === "DeptHead") {
        const departmentId = user?.departmentId;
        if (!departmentId) {
          setRequests([]);
          setError("Your account is missing a Department assignment.");
          return;
        }
        const data = await ticketService.getDepartmentTickets({ departmentId });
        setRequests(data);
      } else if (role === "Admin") {
        const data = await ticketService.getApprovedTickets();
        setRequests(data);
      } else if (role === "Vendor") {
        const data = await ticketService.getVendorAssigned();
        setRequests(data);
      } else {
        setRequests([]);
        setError("Unknown role. Please contact support.");
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load tickets. Please try again.");
    }
  };

  const fetchVendorsIfNeeded = async () => {
    if (role !== "Admin") return;
    try {
      const data = await ticketService.getVendors();
      setVendors(data);
    } catch (e) {
      console.error(e);
      setVendors([]);
      setError((prev) => prev || "Failed to load vendors.");
    }
  };

  useEffect(() => {
    let intervalId;
    (async () => {
      setLoading(true);
      await Promise.all([fetchRequests(), fetchVendorsIfNeeded()]);
      setLoading(false);
      intervalId = setInterval(() => {
        fetchRequests();
      }, 15000);
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [role]);

  const handleDeptHeadUpdate = async (requestID, status) => {
    try {
      await ticketService.updateTicketStatus(requestID, { status });
      await fetchRequests();
    } catch (e) {
      console.error(e);
      setError(e?.message || e?.response?.data || "Failed to update status.");
    }
  };

  const handleDispatchVendor = async (requestID) => {
    const vendorID = vendorPick[requestID];
    if (!vendorID) {
      setError("Please select a vendor before dispatching.");
      return;
    }
    try {
      await ticketService.assignVendor(requestID, vendorID);
      await fetchRequests();
    } catch (e) {
      console.error(e);
      setError(e?.message || e?.response?.data || "Failed to dispatch ticket.");
    }
  };

  const handleVendorComplete = async (requestID) => {
    const resolutionNotes = vendorNotes[requestID];
    if (!resolutionNotes || !resolutionNotes.trim()) {
      setError("Please add resolution notes before completing.");
      return;
    }
    try {
      await ticketService.resolveTicket(requestID, resolutionNotes.trim());
      await fetchRequests();
    } catch (e) {
      console.error(e);
      setError(e?.message || e?.response?.data || "Failed to complete ticket.");
    }
  };

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress sx={{ color: PTUT_GREEN }} />
      </Box>
    );

  return (
    <Box>
      {/* Header Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          pb: 4,
          mb: 4,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}
          >
            {role === "Requester"
              ? "My Tickets"
              : role === "DeptHead"
                ? "Department Tickets"
                : role === "Admin"
                  ? "Approved Tickets"
                  : role === "Vendor"
                    ? "My Assigned Tasks"
                    : "Tickets"}
          </Typography>
          <Typography
            sx={{ color: "#6b7280", mt: 0.5, fontSize: 15, fontWeight: 500 }}
          >
            {role === "Requester"
              ? "Track the real-time status of your submitted tickets."
              : role === "DeptHead"
                ? "Approve or reject requests for your department."
                : role === "Admin"
                  ? "Dispatch approved tickets to vendors."
                  : role === "Vendor"
                    ? "Complete assigned repairs and add resolution notes."
                    : "Monitor maintenance tickets."}
          </Typography>
        </Box>
        {canCreate && (
          <Button
            component={RouterLink}
            to="/create-request"
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            sx={{
              bgcolor: PTUT_GREEN,
              "&:hover": { bgcolor: "#004f2a" },
              borderRadius: 1,
              px: 3,
              py: 1.5,
              fontWeight: 700,
              textTransform: "none",
              fontSize: 15,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            New Request
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
          {error}
        </Alert>
      )}

      {/* Cards Grid */}
      <Grid container spacing={3}>
        {requests.map((req) => (
          <Grid item xs={12} sm={6} lg={4} key={req.requestID}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: PTUT_GREEN,
                  boxShadow: "0 8px 24px rgba(0,104,56,0.1)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: "#111827",
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {req.title}
                  </Typography>
                  <Chip
                    label={statusLabel(req.status)}
                    color={statusColors[req.status] || "default"}
                    size="small"
                    sx={{ fontWeight: 700, borderRadius: 0.5, flexShrink: 0 }}
                  />
                </Box>

                <Typography
                  sx={{
                    color: "#111827",
                    fontSize: 13,
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  Location:{" "}
                  <span style={{ fontWeight: 600 }}>{req.location}</span>
                </Typography>
                <Typography
                  sx={{
                    color: "#6b7280",
                    fontSize: 14,
                    lineHeight: 1.6,
                    flexGrow: 1,
                    mb: 3,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {req.description}
                </Typography>

                {role === "Admin" && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <TextField
                      select
                      label="Assign Vendor"
                      value={vendorPick[req.requestID] || ""}
                      onChange={(e) =>
                        setVendorPick((p) => ({
                          ...p,
                          [req.requestID]: e.target.value,
                        }))
                      }
                      size="small"
                    >
                      {vendors.length === 0 ? (
                        <MenuItem value="" disabled>
                          No vendors available
                        </MenuItem>
                      ) : (
                        vendors.map((v) => (
                          <MenuItem key={v.vendorID} value={v.vendorID}>
                            {v.companyName}
                          </MenuItem>
                        ))
                      )}
                    </TextField>
                    <Button
                      variant="contained"
                      disableElevation
                      onClick={() => handleDispatchVendor(req.requestID)}
                      sx={{
                        bgcolor: PTUT_GREEN,
                        "&:hover": { bgcolor: "#004f2a" },
                        borderRadius: 1,
                        fontWeight: 800,
                        textTransform: "none",
                      }}
                      disabled={vendors.length === 0}
                    >
                      Dispatch
                    </Button>
                  </Box>
                )}

                {role === "DeptHead" && req.status === "Pending" && (
                  <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                    <Button
                      variant="contained"
                      disableElevation
                      onClick={() =>
                        handleDeptHeadUpdate(req.requestID, "Approved")
                      }
                      sx={{
                        bgcolor: PTUT_GREEN,
                        "&:hover": { bgcolor: "#004f2a" },
                        borderRadius: 1,
                        fontWeight: 800,
                        textTransform: "none",
                        flex: 1,
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() =>
                        handleDeptHeadUpdate(req.requestID, "Rejected")
                      }
                      sx={{
                        borderRadius: 1,
                        fontWeight: 800,
                        textTransform: "none",
                        flex: 1,
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                )}

                {role === "Vendor" && req.status === "In Progress" && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <TextField
                      label="Resolution Notes"
                      multiline
                      rows={3}
                      value={vendorNotes[req.requestID] || ""}
                      onChange={(e) =>
                        setVendorNotes((p) => ({
                          ...p,
                          [req.requestID]: e.target.value,
                        }))
                      }
                      size="small"
                    />
                    <Button
                      variant="contained"
                      disableElevation
                      onClick={() => handleVendorComplete(req.requestID)}
                      sx={{
                        bgcolor: PTUT_GREEN,
                        "&:hover": { bgcolor: "#004f2a" },
                        borderRadius: 1,
                        fontWeight: 800,
                        textTransform: "none",
                      }}
                    >
                      Mark Resolved
                    </Button>
                  </Box>
                )}

                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      bgcolor: "#f9fafb",
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {req.departmentName
                        ? req.departmentName
                        : `Dept ${req.departmentID}`}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <CalendarTodayIcon
                      sx={{ fontSize: 14, color: "#9ca3af" }}
                    />
                    <Typography
                      sx={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}
                    >
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Typography>
                  </Box>
                </Box>

                {req.assignedVendorName && (
                  <Typography
                    sx={{
                      mt: 1.5,
                      fontSize: 12,
                      color: "#6b7280",
                      fontWeight: 700,
                    }}
                  >
                    Vendor:{" "}
                    <span style={{ fontWeight: 600 }}>
                      {req.assignedVendorName}
                    </span>
                  </Typography>
                )}

                {req.resolutionNotes && (
                  <Typography sx={{ mt: 1, fontSize: 12, color: "#6b7280" }}>
                    Notes: {req.resolutionNotes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {requests.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 12,
            px: 4,
            bgcolor: "#fff",
            borderRadius: 2,
            border: "1px solid #e5e7eb",
            mt: 4,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              bgcolor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <AddIcon sx={{ fontSize: 36, color: "#d1d5db" }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 900, color: "#111827", mb: 1 }}
          >
            {role === "Requester" ? "No requests yet" : "No tickets yet"}
          </Typography>
          <Typography
            sx={{
              color: "#6b7280",
              fontSize: 15,
              mb: 4,
              maxWidth: 360,
              mx: "auto",
            }}
          >
            {role === "Requester"
              ? "The university is running smoothly! Create a new ticket if you find an issue."
              : "Nothing is pending for you right now."}
          </Typography>
          {canCreate && (
            <Button
              component={RouterLink}
              to="/create-request"
              variant="contained"
              disableElevation
              sx={{
                bgcolor: PTUT_GREEN,
                "&:hover": { bgcolor: "#004f2a" },
                borderRadius: 1,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                textTransform: "none",
                fontSize: 15,
              }}
            >
              Create Your First Request
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
