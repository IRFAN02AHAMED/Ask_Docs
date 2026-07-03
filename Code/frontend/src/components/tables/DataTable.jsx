import React from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, Box,
} from "@mui/material";
import EmptyState from "../common/EmptyState";
import AppLoader from "../common/AppLoader";

const DataTable = ({ columns = [], rows = [], loading = false, pagination, onPageChange, onRowsPerPageChange, emptyMessage = "No data found" }) => {
  if (loading) {
    return <AppLoader message="Loading data..." />;
  }

  if (!rows || rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "12px", overflow: "hidden", backgroundColor: "#FFFFFF" }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.field} sx={{ minWidth: col.minWidth || "auto" }}>
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex} hover>
                {columns.map((col) => (
                  <TableCell key={col.field}>
                    {col.renderCell ? col.renderCell(row) : row[col.field] || "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total || 0}
          page={(pagination.page || 1) - 1}
          rowsPerPage={pagination.page_size || 10}
          onPageChange={(e, newPage) => onPageChange?.(newPage + 1)}
          onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ borderTop: "1px solid #F3F4F6" }}
        />
      )}
    </Box>
  );
};

export default DataTable;
