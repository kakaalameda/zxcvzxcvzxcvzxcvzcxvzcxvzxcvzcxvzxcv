/* eslint-disable react-hooks/incompatible-library */

"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  pageSize?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No data.",
  pageSize = 20,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize, pageIndex: 0 },
    },
  });

  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const totalRows = data.length;
  const from = totalRows === 0 ? 0 : pageIndex * currentPageSize + 1;
  const to = Math.min((pageIndex + 1) * currentPageSize, totalRows);
  const pageCount = table.getPageCount();

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/60 bg-background/60">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls — only show when there's more than one page */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-white/40">
            {from}–{to} / {totalRows} sản phẩm
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/50 transition-colors hover:border-gold-500/40 hover:text-gold-500 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              aria-label="Trang đầu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <polyline points="11 17 6 12 11 7" /><line x1="18" y1="12" x2="6" y2="12" />
              </svg>
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/50 transition-colors hover:border-gold-500/40 hover:text-gold-500 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              aria-label="Trang trước"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Page number pills */}
            {Array.from({ length: pageCount }, (_, i) => i).map((page) => {
              const isNear =
                Math.abs(page - pageIndex) <= 1 ||
                page === 0 ||
                page === pageCount - 1;
              const isEllipsis =
                !isNear &&
                (page === 1 || page === pageCount - 2) &&
                Math.abs(page - pageIndex) === 2;

              if (!isNear && !isEllipsis) return null;

              if (isEllipsis) {
                return (
                  <span key={page} className="text-xs text-white/30 px-1">
                    …
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => table.setPageIndex(page)}
                  className={[
                    "flex h-7 min-w-7 px-2 items-center justify-center rounded-md border text-xs font-medium transition-colors bg-transparent cursor-pointer",
                    page === pageIndex
                      ? "border-gold-500/60 text-gold-500"
                      : "border-white/10 text-white/50 hover:border-gold-500/40 hover:text-gold-500",
                  ].join(" ")}
                >
                  {page + 1}
                </button>
              );
            })}

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/50 transition-colors hover:border-gold-500/40 hover:text-gold-500 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              aria-label="Trang sau"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/50 transition-colors hover:border-gold-500/40 hover:text-gold-500 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              aria-label="Trang cuối"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <polyline points="13 17 18 12 13 7" /><line x1="6" y1="12" x2="18" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Always show count when no pagination needed */}
      {pageCount <= 1 && totalRows > 0 && (
        <p className="px-1 text-xs text-white/30">{totalRows} sản phẩm</p>
      )}
    </div>
  );
}
