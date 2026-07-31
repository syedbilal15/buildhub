import { type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
  hideOn?: "sm" | "md";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data found",
  emptyIcon,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="py-16 text-center">
        {emptyIcon && <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">{emptyIcon}</div>}
        <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
                  col.className || ""
                } ${col.hideOn === "sm" ? "hidden sm:table-cell" : ""} ${
                  col.hideOn === "md" ? "hidden md:table-cell" : ""
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="transition-colors hover:bg-slate-50/50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-5 py-4 text-slate-700 ${
                    col.className || ""
                  } ${col.hideOn === "sm" ? "hidden sm:table-cell" : ""} ${
                    col.hideOn === "md" ? "hidden md:table-cell" : ""
                  }`}
                >
                  {col.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
