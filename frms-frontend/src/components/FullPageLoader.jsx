import { Box, CircularProgress, Typography } from "@mui/material";

export default function FullPageLoader({ label = "Loading…" }) {
  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography
          sx={{ color: "text.secondary", fontWeight: 700, fontSize: 13 }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
