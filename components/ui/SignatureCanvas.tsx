"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Clear, Save, Undo } from "@mui/icons-material";

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  onSignatureChange?: (signature: string | null) => void;
  onSave?: (signature: string | null) => void;
  disabled?: boolean;
  initialSignature?: string | null;
  title?: string;
  showSaveButton?: boolean;
  saveButtonText?: string;
}

interface Point {
  x: number;
  y: number;
}

export default function SignatureCanvas({
  width = 400,
  height = 200,
  strokeColor = "#000000",
  strokeWidth = 2,
  backgroundColor = "#ffffff",
  onSignatureChange,
  onSave,
  disabled = false,
  initialSignature = null,
  title = "Signature",
  showSaveButton = false,
  saveButtonText = "Save Signature",
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  // Initialize canvas context and load initial signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas properties
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    // Clear canvas with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setIsEmpty(false);
      };
      img.src = initialSignature;
    }
  }, [
    width,
    height,
    strokeColor,
    strokeWidth,
    backgroundColor,
    initialSignature,
  ]);

  // Get mouse/touch position relative to canvas
  const getEventPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        // Touch event
        const touch = e.touches[0] || e.changedTouches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      } else {
        // Mouse event
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      }
    },
    []
  );

  // Start drawing
  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;

      e.preventDefault();
      const pos = getEventPos(e);
      setIsDrawing(true);
      setCurrentPath([pos]);
      setIsEmpty(false);
    },
    [disabled, getEventPos]
  );

  // Continue drawing
  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled) return;

      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const pos = getEventPos(e);
      setCurrentPath((prev) => {
        const newPath = [...prev, pos];

        // Draw line to current position
        if (newPath.length > 1) {
          const prevPos = newPath[newPath.length - 2];
          ctx.beginPath();
          ctx.moveTo(prevPos.x, prevPos.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }

        return newPath;
      });
    },
    [isDrawing, disabled, getEventPos]
  );

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setPaths((prev) => [...prev, currentPath]);
    setCurrentPath([]);

    // Emit signature change
    if (onSignatureChange) {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL("image/png");
        onSignatureChange(dataURL);
      }
    }
  }, [isDrawing, currentPath, onSignatureChange]);

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    setPaths([]);
    setCurrentPath([]);
    setIsEmpty(true);

    if (onSignatureChange) {
      onSignatureChange(null);
    }
  }, [backgroundColor, width, height, onSignatureChange]);

  // Undo last stroke
  const undoStroke = useCallback(() => {
    if (paths.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Remove last path
    const newPaths = paths.slice(0, -1);
    setPaths(newPaths);

    // Clear and redraw
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Redraw all remaining paths
    newPaths.forEach((path) => {
      if (path.length > 1) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        path.slice(1).forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
    });

    const newIsEmpty = newPaths.length === 0;
    setIsEmpty(newIsEmpty);

    if (onSignatureChange) {
      if (newIsEmpty) {
        onSignatureChange(null);
      } else {
        const dataURL = canvas.toDataURL("image/png");
        onSignatureChange(dataURL);
      }
    }
  }, [paths, backgroundColor, width, height, onSignatureChange]);

  // Save signature
  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return null;

    const dataURL = canvas.toDataURL("image/png");

    // Call onSave callback if provided
    if (onSave) {
      onSave(dataURL);
    }

    return dataURL;
  }, [isEmpty, onSave]);

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" component="h3">
          {title}
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Undo last stroke">
            <span>
              <IconButton
                onClick={undoStroke}
                disabled={disabled || paths.length === 0}
                size="small"
              >
                <Undo />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Clear signature">
            <span>
              <IconButton
                onClick={clearSignature}
                disabled={disabled || isEmpty}
                color="error"
                size="small"
              >
                <Clear />
              </IconButton>
            </span>
          </Tooltip>

          {showSaveButton && (
            <Tooltip title="Save signature">
              <span>
                <IconButton
                  onClick={saveSignature}
                  disabled={disabled || isEmpty}
                  color="primary"
                  size="small"
                >
                  <Save />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          border: "2px dashed #ccc",
          borderRadius: 1,
          p: 1,
          backgroundColor: "#fafafa",
          display: "flex",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            border: "1px solid #ddd",
            borderRadius: 4,
            backgroundColor,
            cursor: disabled ? "not-allowed" : "crosshair",
            touchAction: "none", // Prevent scrolling on touch devices
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {isEmpty && !disabled && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              color: "text.secondary",
              fontSize: "0.875rem",
            }}
          >
            Draw your signature here
          </Box>
        )}
      </Box>

      {showSaveButton && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={saveSignature}
            disabled={disabled || isEmpty}
            startIcon={<Save />}
            sx={{ borderRadius: 2 }}
          >
            {saveButtonText}
          </Button>
        </Box>
      )}

      {disabled && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Signature editing is currently disabled
        </Alert>
      )}
    </Paper>
  );
}
