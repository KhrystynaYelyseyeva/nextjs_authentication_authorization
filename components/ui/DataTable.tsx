"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Typography,
  TableSortLabel,
  CircularProgress,
} from "@mui/material";
import { Search, Refresh } from "@mui/icons-material";

export type Column<T> = {
  id: string;
  label: string;
  minWidth?: number;
  align?: "right" | "left" | "center";
  format?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
};

type SortDirection = "asc" | "desc";

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  title?: string;
  emptyMessage?: string;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  onRowClick?: (item: T) => void;
};

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  error = null,
  onRefresh,
  title,
  emptyMessage = "No data available",
  rowsPerPageOptions = [10, 25, 50, 100],
  defaultRowsPerPage = 10,
  onRowClick,
}: DataTableProps<T>) {
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // Sorting state
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page on search
  };

  // Handle sort
  const handleSort = (columnId: string) => {
    const isAsc = sortBy === columnId && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortBy(columnId);
    setPage(0); // Reset to first page on sort
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    // First filter the data
    let filteredData = data;

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();

      filteredData = data.filter((row) => {
        // Check each column for matches
        return columns.some((column) => {
          // Get the value for this column
          const value = (row as any)[column.id];

          // If the value is a string, check if it contains the search query
          if (typeof value === "string") {
            return value.toLowerCase().includes(lowerCaseQuery);
          }

          // If the value is a number, check if its string representation matches
          if (typeof value === "number") {
            return value.toString().includes(lowerCaseQuery);
          }

          return false;
        });
      });
    }

    // Then sort the data
    if (sortBy) {
      filteredData = [...filteredData].sort((a, b) => {
        const aValue = (a as any)[sortBy];
        const bValue = (b as any)[sortBy];

        // Handle different data types
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        // Default sort (for mixed data types)
        return sortDirection === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return filteredData;
  }, [data, columns, searchQuery, sortBy, sortDirection]);

  // Get current page of data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedData, page, rowsPerPage]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  return (
    <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 2 }}>
      {/* Header with search and title */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" component="div" fontWeight="500">
          {title}
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220 }}
          />

          {onRefresh && (
            <Tooltip title="Refresh data">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Box sx={{ p: 2, bgcolor: "error.light" }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || "left"}
                  style={{ minWidth: column.minWidth, fontWeight: 600 }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortDirection : "asc"}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 5 }}
                >
                  <CircularProgress size={40} />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Loading data...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row) => {
                const key = keyExtractor(row);

                return (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{ cursor: onRowClick ? "pointer" : "default" }}
                  >
                    {columns.map((column) => {
                      const value = (row as any)[column.id];

                      return (
                        <TableCell
                          key={column.id}
                          align={column.align || "left"}
                        >
                          {column.format ? column.format(value, row) : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 5 }}
                >
                  <Typography variant="body1" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={filteredAndSortedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
