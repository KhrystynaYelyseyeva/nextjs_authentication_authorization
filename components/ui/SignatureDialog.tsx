"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Save, Cancel } from "@mui/icons-material";
import SignatureCanvas from "./SignatureCanvas";

interface SignatureDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (signature: string | null) => Promise<void>;
  initialSignature?: string | null;
  loading?: boolean;
  title?: string;
}

export default function SignatureDialog({
  open,
  onClose,
  onSave,
  initialSignature = null,
  loading = false,
  title = "Manage Signature",
}: SignatureDialogProps) {
  const [currentSignature, setCurrentSignature] = useState<string | null>(
    initialSignature
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle signature change from canvas
  const handleSignatureChange = useCallback((signature: string | null) => {
    setCurrentSignature(signature);
    setError(null);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      await onSave(currentSignature);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save signature");
    } finally {
      setSaving(false);
    }
  }, [currentSignature, onSave, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!saving) {
      setError(null);
      setCurrentSignature(initialSignature);
      onClose();
    }
  }, [saving, initialSignature, onClose]);

  // Check if signature has changed
  const hasChanges = currentSignature !== initialSignature;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {initialSignature && (
            <Typography variant="body2" color="text.secondary">
              Current signature on file
            </Typography>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 1 }}>
          {/* Show current signature if exists */}
          {initialSignature && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Signature:
              </Typography>
              <Box
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  p: 1,
                  backgroundColor: "#f9f9f9",
                  display: "flex",
                  justifyContent: "center",
                  minHeight: 60,
                  alignItems: "center",
                }}
              >
                <img
                  src={initialSignature}
                  alt="Current signature"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 100,
                    objectFit: "contain",
                  }}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          {/* Signature canvas */}
          <Typography variant="subtitle2" gutterBottom>
            {initialSignature ? "Update Signature:" : "Create Signature:"}
          </Typography>

          <SignatureCanvas
            width={500}
            height={200}
            onSignatureChange={handleSignatureChange}
            disabled={loading || saving}
            title=""
          />

          {/* Help text */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Draw your signature using your mouse or touch. You can undo strokes
            or clear completely to start over.
          </Typography>

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={saving}
          variant="outlined"
          startIcon={<Cancel />}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving || loading || !hasChanges}
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
        >
          {saving ? "Saving..." : "Save Signature"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
