"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Avatar,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  AdminPanelSettings,
  PersonOutline,
  Edit,
  Delete,
  Add,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/types/auth-types";
import DataTable, { Column } from "@/components/ui/DataTable";
import { useEnhancedQuery, useEnhancedMutation } from "@/hooks/useQueryHook";
import {
  USERS_QUERY,
  DELETE_USER_MUTATION,
  UsersQueryResult,
} from "@/graphql/types";
import UserEditorDialog from "@/components/admin/UserEditorDialog";

export default function AdminPage() {
  // Get auth context
  const { user } = useAuth();

  // State for user to edit or delete
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Fetch users data
  const { data, loading, error, refetch } = useEnhancedQuery<UsersQueryResult>(
    USERS_QUERY,
    {
      errorMessage: "Failed to load users data",
      fetchPolicy: "cache-and-network",
    }
  );

  // Delete user mutation
  const { mutate: deleteUser, loading: deleteLoading } = useEnhancedMutation(
    DELETE_USER_MUTATION,
    {
      onCompleted: () => {
        setShowDeleteDialog(false);
        refetch();
      },
      errorMessage: "Failed to delete user",
    }
  );

  // Format current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Handle user edit
  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setIsNewUser(false);
    setShowEditDialog(true);
  }, []);

  // Handle user delete confirmation
  const handleDeleteConfirm = useCallback((user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  }, []);

  // Handle user delete
  const handleDeleteUser = useCallback(() => {
    if (selectedUser) {
      deleteUser({ variables: { id: selectedUser.id } });
    }
  }, [selectedUser, deleteUser]);

  // Close delete dialog
  const handleCloseDeleteDialog = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  // Handle add user
  const handleAddUser = useCallback(() => {
    setSelectedUser(null);
    setIsNewUser(true);
    setShowEditDialog(true);
  }, []);

  // Handle close edit dialog
  const handleCloseEditDialog = useCallback(() => {
    setShowEditDialog(false);
    setSelectedUser(null);
    setIsNewUser(false);
  }, []);

  // Handle save from edit dialog
  const handleUserSaved = useCallback(() => {
    refetch();
  }, [refetch]);

  // Define user table columns
  const userColumns = useMemo<Column<User>[]>(
    () => [
      {
        id: "name",
        label: "User",
        minWidth: 170,
        format: (value, row) => (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              sx={{
                width: 30,
                height: 30,
                mr: 1,
                bgcolor:
                  row.role === "ADMIN" ? "secondary.main" : "primary.main",
                fontSize: "0.875rem",
              }}
            >
              {typeof value === "string" && value.charAt(0).toUpperCase()}
            </Avatar>
            {String(value)}
          </Box>
        ),
        sortable: true,
      },
      {
        id: "email",
        label: "Email",
        minWidth: 170,
        sortable: true,
      },
      {
        id: "role",
        label: "Role",
        minWidth: 100,
        format: (value) => (
          <Chip
            size="small"
            label={String(value)}
            color={value === "ADMIN" ? "secondary" : "primary"}
            icon={
              value === "ADMIN" ? <AdminPanelSettings /> : <PersonOutline />
            }
          />
        ),
        sortable: true,
      },
      {
        id: "id",
        label: "ID",
        minWidth: 170,
      },
      {
        id: "actions",
        label: "Actions",
        minWidth: 120,
        align: "center",
        format: (_, row) => (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Tooltip title="Edit User">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditUser(row);
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Don't allow deleting yourself */}
            {row.id !== user?.id && (
              <Tooltip title="Delete User">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConfirm(row);
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [handleEditUser, handleDeleteConfirm, user?.id]
  );

  // Calculate system statistics
  const users = useMemo(() => data?.users || [], [data]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="500">
          Admin Dashboard
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {currentDate}
        </Typography>

        <Paper
          elevation={2}
          sx={{
            p: 3,
            mt: 2,
            mb: 4,
            borderRadius: 2,
            backgroundImage:
              "linear-gradient(to right, rgba(156, 39, 176, 0.05), #ffffff)",
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar
                sx={{
                  width: 70,
                  height: 70,
                  bgcolor: "secondary.main",
                  fontSize: "1.75rem",
                  fontWeight: "bold",
                }}
              >
                {user?.name.charAt(0).toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                Admin Control Panel
              </Typography>
            </Grid>
            <Grid item>
              <Chip
                label="Administrator"
                color="secondary"
                icon={<AdminPanelSettings />}
                sx={{ fontWeight: "bold" }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* User Management Table */}
        <Box sx={{ mb: 4, position: "relative" }}>
          {/* Add User Button - positioned above the table */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Add />}
              onClick={handleAddUser}
              sx={{ borderRadius: 2 }}
            >
              Add User
            </Button>
          </Box>

          {/* User Data Table */}
          <DataTable<User>
            title="User Management"
            columns={userColumns}
            data={users}
            keyExtractor={(user) => user.id}
            loading={loading}
            error={error}
            onRefresh={refetch}
            emptyMessage="No users found"
          />
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm User Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete user{" "}
            <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            autoFocus
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Editor Dialog */}
      <UserEditorDialog
        open={showEditDialog}
        onClose={handleCloseEditDialog}
        user={selectedUser}
        onSaved={handleUserSaved}
        isNewUser={isNewUser}
      />
    </Container>
  );
}
