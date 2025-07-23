"use client";

import { useState } from "react";
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
  Button,
  Paper,
} from "@mui/material";
import {
  AccountCircle,
  Email,
  AdminPanelSettings,
  PersonOutline,
  ShieldOutlined,
  Draw,
  Edit,
} from "@mui/icons-material";
import { useEnhancedMutation } from "@/hooks/useQueryHook";
import { UPDATE_SIGNATURE_MUTATION } from "@/graphql/types";
import SignatureDialog from "@/components/ui/SignatureDialog";

// GraphQL query to get current user data
const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      name
      email
      role
      signature
    }
  }
`;

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  // Fetch data from GraphQL
  const { loading, error } = useQuery(GET_USER_PROFILE);

  // Update signature mutation
  const { mutate: updateSignature, loading: updateLoading } =
    useEnhancedMutation(UPDATE_SIGNATURE_MUTATION, {
      onCompleted: () => {
        refreshUser(); // Refresh user data in context
        setShowSignatureDialog(false);
      },
      errorMessage: "Failed to update signature",
    });

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSignatureUpdate = async (signature: string | null) => {
    await updateSignature({
      variables: { signature },
    });
  };

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

        <Grid container spacing={3}>
          {/* Account Information Card */}
          <Grid item xs={12} md={8}>
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

          {/* Signature Management Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%", borderRadius: 2 }}>
              <CardHeader
                title="Digital Signature"
                sx={{
                  backgroundColor: "secondary.main",
                  color: "white",
                  "& .MuiCardHeader-subheader": {
                    color: "rgba(255,255,255,0.7)",
                  },
                }}
                subheader="Manage your signature"
              />
              <CardContent>
                {user?.signature ? (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Current Signature:
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 2,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 80,
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <img
                        src={user.signature}
                        alt="User signature"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 60,
                          objectFit: "contain",
                        }}
                      />
                    </Paper>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Edit />}
                      onClick={() => setShowSignatureDialog(true)}
                      disabled={updateLoading}
                    >
                      Update Signature
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center" }}>
                    <Draw
                      sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      No signature on file
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Draw />}
                      onClick={() => setShowSignatureDialog(true)}
                      disabled={updateLoading}
                    >
                      Create Signature
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Signature Dialog */}
      <SignatureDialog
        open={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        onSave={handleSignatureUpdate}
        initialSignature={user?.signature || null}
        loading={updateLoading}
        title={user?.signature ? "Update Signature" : "Create Signature"}
      />
    </Container>
  );
}
