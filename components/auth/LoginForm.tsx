"use client";
import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Lock } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { LoginCredentials } from "@/types/auth-types";
import { useFormValidation } from "@/hooks/useFormValidation";
import { loginSchema } from "@/validationSchemas"; // Fixed import

export default function LoginForm() {
  // Get router and search params
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("success");
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  // Add a ref to prevent multiple redirects
  const redirectAttempted = useRef(false);

  // Get auth context
  const {
    login,
    isAuthenticated,
    loading: authLoading,
    error: authError,
    clearError,
  } = useAuth();

  // Form state
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(
    !!successMessage
  );

  // Form validation - removed unused clearErrors
  const { errors, validateForm, validateField } =
    useFormValidation(loginSchema);

  // Redirect if already authenticated
  useEffect(() => {
    // Skip first render and only redirect if authenticated AND not already attempted
    if (isAuthenticated && !redirectAttempted.current && !authLoading) {
      redirectAttempted.current = true;

      // Add a small delay to avoid immediate redirect
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, router, returnTo]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev: LoginCredentials) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field on change
    validateField(name as keyof LoginCredentials, value);
  };

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    clearError();

    // Validate form
    if (!validateForm(formData)) {
      return;
    }

    setFormSubmitting(true);

    try {
      const result = await login(formData);

      if (result.success) {
        // Redirect on successful login
        router.push(returnTo);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle success message close
  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Login
        </Typography>

        {/* Success message (from registration, etc.) */}
        <Snackbar
          open={showSuccessMessage}
          autoHideDuration={6000}
          onClose={handleCloseSuccessMessage}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSuccessMessage}
            severity="success"
            sx={{ width: "100%" }}
          >
            {successMessage}
          </Alert>
        </Snackbar>

        {/* Auth error */}
        {authError && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {authError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
            disabled={formSubmitting || authLoading}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
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
                    disabled={formSubmitting || authLoading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={formSubmitting || authLoading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={formSubmitting || authLoading}
          >
            {formSubmitting || authLoading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </Button>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="body2">
              {"Don't have an account? "}
              <Link
                href="/signup"
                style={{ color: "primary.main", textDecoration: "none" }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
