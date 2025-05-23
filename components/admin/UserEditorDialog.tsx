"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert,
  SelectChangeEvent, // Import the correct event type
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
  LockReset,
} from "@mui/icons-material";
import { useForm } from "@/hooks/useForm";
import { User, UserRole } from "@/types/auth-types";
import { useEnhancedMutation } from "@/hooks/useQueryHook";
import { UPDATE_USER_MUTATION } from "@/graphql/types";
import { userEditSchema } from "@/validationSchemas"; // Assuming this exists

interface UserEditorDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSaved: () => void;
  isNewUser?: boolean;
}

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  confirmPassword: string;
  [key: string]: unknown;
}

export default function UserEditorDialog({
  open,
  onClose,
  user,
  onSaved,
  isNewUser = false,
}: UserEditorDialogProps) {
  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize form with empty values or existing user data
  const initialValues: UserFormData = {
    name: user?.name || "",
    email: user?.email || "",
    role: (user?.role as UserRole) || "USER",
    password: "",
    confirmPassword: "",
  };

  // Update user mutation
  const { mutate: updateUser, error: updateError } = useEnhancedMutation(
    UPDATE_USER_MUTATION,
    {
      onCompleted: () => {
        onSaved();
        onClose();
      },
    }
  );

  // Setup form with validation
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    setFieldValue,
    resetForm,
    isSubmitting,
  } = useForm<UserFormData>(
    initialValues,
    userEditSchema,
    async (formValues) => {
      try {
        // Extract relevant fields for mutation
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword, ...userData } = formValues;

        // Don't include empty password in update
        if (!userData.password) {
          delete userData.password;
        }

        // Call mutation
        if (isNewUser) {
          // TODO: Call signup mutation
        } else if (user) {
          // Call update mutation
          await updateUser({
            variables: {
              id: user.id,
              input: userData,
            },
          });
        }
      } catch (error) {
        console.error("Error saving user:", error);
      }
    }
  );

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open && user) {
      resetForm();
    }
  }, [open, user, resetForm]);

  // Toggle password visibility
  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Toggle confirm password visibility
  const handleToggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Handle role change - special handler for Select component
  const handleRoleChange = useCallback(
    (event: SelectChangeEvent<UserRole>) => {
      setFieldValue("role", event.target.value as UserRole);
    },
    [setFieldValue]
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        {isNewUser ? "Create New User" : `Edit User: ${user?.name}`}
      </DialogTitle>

      <DialogContent>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          {/* Name field */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Email field */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Role select - Use the specific handler for Select */}
          <FormControl fullWidth margin="normal" error={!!errors.role}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              name="role"
              value={values.role}
              onChange={handleRoleChange}
              label="Role"
              disabled={isSubmitting}
            >
              <MenuItem value="USER">User</MenuItem>
              <MenuItem value="ADMIN">Administrator</MenuItem>
            </Select>
            {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
          </FormControl>

          {/* Password fields - only required for new users */}
          <TextField
            margin="normal"
            fullWidth
            name="password"
            label={
              isNewUser
                ? "Password (Required)"
                : "Password (Leave blank to keep current)"
            }
            type={showPassword ? "text" : "password"}
            id="password"
            value={values.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={
              errors.password ||
              "Password must be at least 8 characters and include uppercase, lowercase, and numbers"
            }
            required={isNewUser}
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
                    edge="end"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Confirm password field - only required for new users or if password is entered */}
          <TextField
            margin="normal"
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={values.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            required={isNewUser || !!values.password}
            disabled={isSubmitting || (!isNewUser && !values.password)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockReset color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={handleToggleConfirmPassword}
                    edge="end"
                    disabled={isSubmitting || (!isNewUser && !values.password)}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Display error if any */}
          {updateError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {updateError}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleSubmit()}
          color="primary"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? "Saving..." : "Save User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
