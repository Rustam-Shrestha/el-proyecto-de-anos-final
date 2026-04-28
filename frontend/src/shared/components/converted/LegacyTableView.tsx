import { memo, ReactNode } from "react";

export type LegacyTableColumn<TData> = {
  key: keyof TData;
  label: string;
  render?: (value: TData[keyof TData], row: TData) => ReactNode;
};

type LegacyTableViewProps<TData extends Record<string, unknown>> = {
  columns: Array<LegacyTableColumn<TData>>;
  rows: TData[];
  emptyMessage?: string;
};

function LegacyTableViewComponent<TData extends Record<string, unknown>>({
  columns,
  rows,
  emptyMessage = "No data found"
}: LegacyTableViewProps<TData>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left border-b border-slate-300">
            {columns.map((column) => (
              <th className="py-2 px-3 text-xs text-slate-700" key={String(column.key)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="py-3 px-3 text-sm text-slate-500" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr className="border-b border-slate-100" key={rowIndex}>
                {columns.map((column) => (
                  <td className="py-2 px-3 text-sm" key={String(column.key)}>
                    {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export const LegacyTableView = memo(LegacyTableViewComponent) as typeof LegacyTableViewComponent;
