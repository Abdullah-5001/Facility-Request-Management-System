import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Chip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ApartmentIcon from "@mui/icons-material/Apartment";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import IconButton from "@mui/material/IconButton";
import { useColorMode } from "../theme/colorMode";

const PTUT_GREEN = "#006838";
const PTUT_RED = "#ED1C24";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();

  if (
    (user?.role === "DeptHead" ||
      user?.role === "Admin" ||
      user?.role === "Requester" ||
      user?.role === "Vendor") &&
    location.pathname === "/dashboard"
  ) {
    return <Outlet />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f9fafb",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "#fff",
          borderBottom: `3px solid ${PTUT_GREEN}`,
          color: "#111827",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{ height: 72, justifyContent: "space-between" }}
          >
            {/* Logo */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
              }}
              onClick={() => navigate("/dashboard")}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: PTUT_GREEN,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 1,
                }}
              >
                <ApartmentIcon sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: PTUT_GREEN,
                    lineHeight: 1,
                    fontSize: 18,
                  }}
                >
                  PTUT Portal
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: PTUT_RED,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Facility Management
                </Typography>
              </Box>
            </Box>

            {/* User Info + Logout */}
            {user && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton aria-label="Toggle theme" onClick={toggleColorMode}>
                  {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1,
                    bgcolor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                  }}
                >
                  <AccountCircleIcon sx={{ color: PTUT_GREEN, fontSize: 22 }} />
                  <Typography
                    sx={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}
                  >
                    {user.name}
                  </Typography>
                  <Chip
                    label={user.role}
                    size="small"
                    sx={{
                      bgcolor: `${PTUT_GREEN}18`,
                      color: PTUT_GREEN,
                      fontWeight: 700,
                      borderRadius: 0.5,
                      height: 24,
                    }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    logout();
                  }}
                  endIcon={<LogoutIcon />}
                  sx={{
                    borderColor: PTUT_RED,
                    color: PTUT_RED,
                    "&:hover": {
                      bgcolor: `${PTUT_RED}0d`,
                      borderColor: PTUT_RED,
                    },
                    borderRadius: 1,
                    px: 2.5,
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  Sign Out
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, py: 5 }}>
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{ bgcolor: "#fff", borderTop: "1px solid #e5e7eb", py: 3 }}
      >
        <Typography
          sx={{
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          &copy; {new Date().getFullYear()} Punjab Tianjin University of
          Technology. Internal Use Only.
        </Typography>
      </Box>
    </Box>
  );
}
