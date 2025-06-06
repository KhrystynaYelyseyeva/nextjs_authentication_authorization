"use client";

import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthDiagnosticPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [testResults, setTestResults] = useState<
    Array<{
      test: string;
      status: "success" | "error" | "pending";
      message: string;
    }>
  >([]);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    setTestResults([]);

    const results: Array<{
      test: string;
      status: "success" | "error" | "pending";
      message: string;
    }> = [];

    // Test 1: Check if cookies exist
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        results.push({
          test: "Cookie Authentication",
          status: "success",
          message: "Cookies are being sent correctly",
        });
      } else {
        results.push({
          test: "Cookie Authentication",
          status: "error",
          message: `Failed with status: ${response.status}`,
        });
      }
    } catch (error) {
      results.push({
        test: "Cookie Authentication",
        status: "error",
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }

    // Test 2: Direct GraphQL query
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query: `
            query {
              me {
                id
                name
                email
                role
              }
            }
          `,
        }),
      });

      const data = await response.json();

      if (response.ok && !data.errors) {
        results.push({
          test: "Direct GraphQL Query",
          status: "success",
          message: `Successfully retrieved user: ${data.data.me?.email}`,
        });
      } else {
        results.push({
          test: "Direct GraphQL Query",
          status: "error",
          message: `Error: ${
            data.errors?.[0]?.message || "Unknown GraphQL error"
          }`,
        });
      }
    } catch (error) {
      results.push({
        test: "Direct GraphQL Query",
        status: "error",
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }

    // Test 3: Token refresh
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        results.push({
          test: "Token Refresh",
          status: "success",
          message: "Token refresh endpoint working",
        });
      } else {
        results.push({
          test: "Token Refresh",
          status: "error",
          message: `Failed with status: ${response.status}`,
        });
      }
    } catch (error) {
      results.push({
        test: "Token Refresh",
        status: "error",
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Authentication Diagnostics
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Auth State
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Loading:</strong> {loading ? "Yes" : "No"}
            </Typography>
            <Typography variant="body2">
              <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
            </Typography>
            <Typography variant="body2">
              <strong>User:</strong>{" "}
              {user ? `${user.name} (${user.email})` : "None"}
            </Typography>
            <Typography variant="body2">
              <strong>Role:</strong> {user?.role || "None"}
            </Typography>
          </Box>
        </Paper>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={runDiagnostics}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} /> : null}
          >
            {testing ? "Running Tests..." : "Run Diagnostics"}
          </Button>
        </Box>

        {testResults.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>

            {testResults.map((result, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Alert
                    severity={result.status === "success" ? "success" : "error"}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle1">{result.test}</Typography>
                  </Alert>
                  <Typography variant="body2">{result.message}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}
