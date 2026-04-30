import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ticketService } from "../services/ticketService";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { usePageTitle } from "../hooks/usePageTitle";

const PTUT_GREEN = "#006838";

const DEPARTMENTS = [
  { id: 1, name: "IT Department" },
  { id: 2, name: "Estate Management" },
  { id: 3, name: "Planning and Development" },
  { id: 4, name: "Academic Department" },
  { id: 5, name: "Quality (QAC) Department" },
  { id: 6, name: "Exam Department" },
];

export default function CreateRequest() {
  usePageTitle("Create Request");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    departmentID: 1,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.location.trim()
    ) {
      setError("Please fill in Title, Description, and Location.");
      return;
    }

    setSubmitting(true);
    try {
      await ticketService.createTicket({ ...form });
      setSuccess("Request submitted successfully! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data ||
          "Failed to submit the request. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Page Header */}
      <Box sx={{ pb: 4, mb: 4, borderBottom: "1px solid #e5e7eb" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{
            color: "#6b7280",
            mb: 2,
            fontWeight: 600,
            textTransform: "none",
            "&:hover": { bgcolor: "#f9fafb" },
          }}
        >
          Back to Dashboard
        </Button>
        <Typography
          variant="h4"
          sx={{ fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}
        >
          Report an Issue
        </Typography>
        <Typography
          sx={{ color: "#6b7280", mt: 0.75, fontSize: 15, fontWeight: 500 }}
        >
          Describe the facility issue so our maintenance team can address it
          rapidly.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* Green top accent */}
        <Box sx={{ bgcolor: PTUT_GREEN, height: 5 }} />

        <Box sx={{ p: { xs: 3, sm: 5 } }}>
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 1 }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <TextField
              fullWidth
              required
              label="Issue Title"
              placeholder="e.g. Broken projector in Room 302"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <TextField
              fullWidth
              required
              label="Location"
              placeholder="e.g. Main Building, Room 302"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <TextField
              fullWidth
              required
              multiline
              rows={6}
              label="Detailed Description"
              placeholder="Provide specifics: exact location, degree of damage, when you noticed it..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <TextField
              fullWidth
              required
              select
              label="Department"
              value={form.departmentID}
              onChange={(e) =>
                setForm({ ...form, departmentID: parseInt(e.target.value) })
              }
            >
              {DEPARTMENTS.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 3,
                pt: 4,
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <Button
                onClick={() => navigate("/dashboard")}
                size="large"
                sx={{
                  color: "#6b7280",
                  borderRadius: 1,
                  px: 3,
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#f9fafb" },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disableElevation
                disabled={submitting}
                sx={{
                  bgcolor: PTUT_GREEN,
                  "&:hover": { bgcolor: "#004f2a" },
                  borderRadius: 1,
                  px: 5,
                  py: 1.5,
                  fontWeight: 700,
                  textTransform: "none",
                  fontSize: 15,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
