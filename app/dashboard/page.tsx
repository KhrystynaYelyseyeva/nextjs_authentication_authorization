"use client";

import { useAuth } from "@/contexts/AuthContext";
import { gql, useQuery } from "@apollo/client";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  AccountCircle,
  Email,
  AdminPanelSettings,
  PersonOutline,
  ShieldOutlined,
} from "@mui/icons-material";

// GraphQL query to get current user data
const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      name
      email
      role
    }
  }
`;

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch data from GraphQL
  const { loading, error } = useQuery(GET_USER_PROFILE);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading your dashboard: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="500">
          Dashboard
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {currentDate}
        </Typography>

        <Grid item xs={12}>
          <Card sx={{ height: "100%", borderRadius: 2 }}>
            <CardHeader
              title="Account Information"
              sx={{
                backgroundColor: "primary.main",
                color: "white",
                "& .MuiCardHeader-subheader": {
                  color: "rgba(255,255,255,0.7)",
                },
              }}
              subheader="Your profile details"
            />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <AccountCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Full Name" secondary={user?.name} />
                </ListItem>

                <Divider variant="inset" component="li" />

                <ListItem>
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Address"
                    secondary={user?.email}
                  />
                </ListItem>

                <Divider variant="inset" component="li" />

                <ListItem>
                  <ListItemIcon>
                    {user?.role === "ADMIN" ? (
                      <AdminPanelSettings color="secondary" />
                    ) : (
                      <PersonOutline color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Account Role"
                    secondary={
                      user?.role === "ADMIN"
                        ? "Administrator (Full Access)"
                        : "Standard User"
                    }
                  />
                </ListItem>

                <Divider variant="inset" component="li" />

                <ListItem>
                  <ListItemIcon>
                    <ShieldOutlined color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Account ID" secondary={user?.id} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Box>
    </Container>
  );
}
