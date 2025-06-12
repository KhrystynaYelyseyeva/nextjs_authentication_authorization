"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  SelectChangeEvent,
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
import { UPDATE_USER_MUTATION, SIGNUP_MUTATION } from "@/graphql/types";
import { editUserSchema, newUserSchema } from "@/validationSchemas";

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

  // Memoize initial values to prevent recreation on every render
  const initialValues = useMemo<UserFormData>(
    () => ({
      name: user?.name || "",
      email: user?.email || "",
      role: (user?.role as UserRole) || "USER",
      password: "",
      confirmPassword: "",
    }),
    [user?.name, user?.email, user?.role]
  );

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

  // Create user mutation
  const { mutate: createUser, error: createError } = useEnhancedMutation(
    SIGNUP_MUTATION,
    {
      onCompleted: () => {
        onSaved();
        onClose();
      },
    }
  );

  // Memoize the submit handler to prevent recreation
  const handleFormSubmit = useCallback(
    async (formValues: UserFormData) => {
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
          // Create new user using signup mutation
          await createUser({
            variables: {
              input: {
                name: userData.name,
                email: userData.email,
                password: userData.password, // Required for new users
              },
            },
          });
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
    },
    [isNewUser, user, updateUser, createUser]
  );

  // Setup form with validation - use memoized values
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
    isNewUser ? newUserSchema : editUserSchema,
    handleFormSubmit
  );

  // Reset form when dialog opens/closes or user changes
  // Fix: Use individual user properties instead of user object
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, user?.id, user?.name, user?.email, user?.role, resetForm]);

  // Toggle password visibility - memoized to prevent recreation
  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Toggle confirm password visibility - memoized to prevent recreation
  const handleToggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  // Handle dialog close - memoized to prevent recreation
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Handle role change - memoized to prevent recreation
  const handleRoleChange = useCallback(
    (event: SelectChangeEvent<UserRole>) => {
      setFieldValue("role", event.target.value as UserRole);
    },
    [setFieldValue]
  );

  // Handle form submission - memoized to prevent recreation
  const handleFormSubmitWrapper = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

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

          {/* Role select */}
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

          {/* Password fields */}
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

          {/* Confirm password field */}
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
          {(updateError || createError) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {updateError || createError}
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
          onClick={handleFormSubmitWrapper}
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
