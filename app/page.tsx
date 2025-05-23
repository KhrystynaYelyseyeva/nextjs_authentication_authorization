"use client";

import Link from "next/link";
import { Container, Typography, Box, Button, Paper, Grid } from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 6, textAlign: "center" }}>
        {isAuthenticated ? (
          <Box sx={{ mt: 4, mb: 6 }}>
            <Paper
              elevation={2}
              sx={{
                p: 4,
                borderRadius: 2,
                maxWidth: 800,
                mx: "auto",
                background:
                  "linear-gradient(to right bottom, #f5f5f5, #ffffff)",
              }}
            >
              <Typography variant="h4" gutterBottom>
                Welcome Back, {user?.name}!
              </Typography>

              <Typography paragraph sx={{ mb: 3 }}>
                {"You're"} currently signed in with {user?.email}. You have
                access to all protected features of this application based on
                your role ({user?.role}).
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  mt: 3,
                }}
              >
                <Button
                  variant="contained"
                  component={Link}
                  href="/dashboard"
                  size="large"
                  sx={{ px: 3 }}
                >
                  Go to Dashboard
                </Button>

                {user?.role === "ADMIN" && (
                  <Button
                    variant="outlined"
                    component={Link}
                    href="/admin"
                    size="large"
                    sx={{ px: 3 }}
                  >
                    Admin Panel
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ mt: 8, mb: 4 }}>
            <Paper sx={{ p: 4, maxWidth: 700, mx: "auto", borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Demo Accounts
              </Typography>

              <Typography paragraph>
                You can use these accounts to explore different roles in the
                application:
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={1}
                    sx={{ p: 2, borderLeft: "4px solid #1976d2" }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      Admin User
                    </Typography>
                    <Typography variant="body2">
                      Email: admin@example.com
                    </Typography>
                    <Typography variant="body2">
                      Password: password123
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={1}
                    sx={{ p: 2, borderLeft: "4px solid #9c27b0" }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      Regular User
                    </Typography>
                    <Typography variant="body2">
                      Email: user@example.com
                    </Typography>
                    <Typography variant="body2">
                      Password: password123
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
}
