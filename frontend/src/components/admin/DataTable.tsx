import type { ReactNode } from 'react'
import { Card } from '../ui/Card'

export interface Column<T> {
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  keyOf: (row: T) => string
  emptyText?: string
}

/** A simple styled table for the admin managers — no pagination, no fuss. */
export function DataTable<T>({ columns, rows, keyOf, emptyText = 'Nothing here yet.' }: DataTableProps<T>) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface2)]/60">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className="font-mono px-5 py-3.5 text-[11px] font-medium uppercase tracking-widest text-[var(--muted)]"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyOf(row)}
                className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--surface2)]/40"
              >
                {columns.map((col) => (
                  <td key={col.header} className={`px-5 py-4 align-middle ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-[var(--muted)]">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
