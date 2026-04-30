import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { authService } from "../services/authService";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Box,
  Alert,
} from "@mui/material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { usePageTitle } from "../hooks/usePageTitle";

const PTUT_GREEN = "#006838";
const PTUT_RED = "#ED1C24";

export default function Register() {
  usePageTitle("Register");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await authService.register({ ...form, role: "Requester" });
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f3f4f6",
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ bgcolor: PTUT_GREEN, height: 6 }} />
          <Box sx={{ px: { xs: 3, sm: 6 }, py: { xs: 4, sm: 6 } }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 5,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: `${PTUT_GREEN}18`,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2.5,
                }}
              >
                <PersonAddAlt1Icon sx={{ color: PTUT_GREEN, fontSize: 32 }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: "#111827",
                  letterSpacing: "-0.5px",
                }}
              >
                Join PTUT
              </Typography>
              <Typography
                sx={{ color: "#6b7280", mt: 1, fontSize: 15, fontWeight: 500 }}
              >
                Create your university facility account
              </Typography>
            </Box>

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
                label="Full Name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <TextField
                fullWidth
                required
                label="University Email"
                type="email"
                helperText="Use your official university email."
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <TextField
                fullWidth
                required
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disableElevation
                sx={{
                  bgcolor: PTUT_RED,
                  "&:hover": { bgcolor: "#c81017" },
                  borderRadius: 1,
                  py: 1.75,
                  fontWeight: 700,
                  textTransform: "none",
                  fontSize: 16,
                  mt: 1,
                }}
              >
                {submitting ? "Creating…" : "Register Account"}
              </Button>

              <Typography
                sx={{ textAlign: "center", color: "#6b7280", fontSize: 14 }}
              >
                Already have an account?{" "}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: PTUT_GREEN,
                    fontWeight: 700,
                    textDecorationColor: PTUT_GREEN,
                  }}
                >
                  Login here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
