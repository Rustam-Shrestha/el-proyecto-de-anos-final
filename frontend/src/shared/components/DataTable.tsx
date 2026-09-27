import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  /** Right-align numeric/action columns. */
  align?: "left" | "right";
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
};

/**
 * Single table primitive for the app.
 *
 * Feature lists (KYC queue, loans, users, ...) all need the same striped
 * header + hover rows + horizontal scroll wrapper, so the markup lives here
 * instead of being copy-pasted into every page.
 */
export function DataTable<T>({ columns, rows, rowKey, caption }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-3 text-[13px] font-semibold text-[#0F172A] ${
                  column.align === "right" ? "text-right" : "text-left"
                } ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-[#F8FAFC]">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-sm ${
                    column.align === "right" ? "text-right" : "text-left"
                  } ${column.className ?? ""}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
