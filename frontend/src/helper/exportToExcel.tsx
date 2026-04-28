// @ts-nocheck
/**
 * exportToExcel Utility
 *
 * Exports tabular data to an Excel (.xlsx) file using the SheetJS (xlsx) library.
 * Handles special cases for serial numbers, employee codes, and nested children arrays.
 *
 * @param {string} fileName - Name for the downloaded file (without extension)
 * @param {Array<{label: string, accessor: string}>} columns - Column definitions
 * @param {Array<object>} rows - Data rows to export
 */
import * as XLSX from "xlsx";

export const exportToExcel = (fileName, columns, rows) => {
  // Use provided columns directly without filtering
  const header = columns.map((col) => col.label);
  const data = [];

  rows.forEach((row) => {
    const jobCount = row.client?.children?.length || 1;

    for (let i = 0; i < jobCount; i++) {
      const rowData = columns.map((col) => {
        const accessor = col.accessor;
        const val = row[accessor];

        // SN usage: only on the first row
        if (accessor === "sn") return i === 0 ? row.sn : "";

        // Employee special handling
        if (accessor === "employee") {
          if (i === 0) {
            // Support both object (with employee_code) and string/other
            if (val && typeof val === 'object' && val.employee_code) {
              return val.employee_code;
            }
            return val || "";
          }
          return "";
        }

        // Handle nested children arrays (for payroll export)
        if (val && typeof val === "object" && Array.isArray(val.children)) {
          return val.children[i] ?? "";
        }

        // Default return
        return val ?? "";
      });

      data.push(rowData);
    }
  });

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
