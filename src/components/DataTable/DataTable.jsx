// ====================================================================
// Reusable Component — DataTable
//
// Used by: All modules with tables (Students, Staff, Fees, Library, Hostel,
//          Transport, Front Office, etc.).
// Purpose: Generic sortable, paginated table built on TanStack Table.
//          Supports row selection, bulk actions, CSV export, and a render
//          prop toolbar for module-specific filters.
// ====================================================================

import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, MoveHorizontal as MoreHorizontal, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/constants/app'
import { exportToCsv } from '@/utils/export'
import { Pagination } from '@/components/Pagination/Pagination'

function exportCsv(table, filename) {
  const rows = table.getSelectedRowModel().rows.length
    ? table.getSelectedRowModel().rows.map((r) => r.original)
    : table.getRowModel().rows.map((r) => r.original)
  const cols = table
    .getVisibleLeafColumns()
    .filter((c) => c.id !== 'select' && c.id !== 'actions')
  const headers = cols.map((c) => ({
    key: c.id,
    label: typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id,
  }))
  exportToCsv(rows, headers, filename)
}

export function DataTable({
  columns,
  data,
  toolbar,
  pageSize = DEFAULT_PAGE_SIZE,
  enableSelection = false,
  enableExport = false,
  exportFilename = 'export',
  onBulkAction,
  bulkActions = [],
  rowActions,
  stickyHeader = true,
  onRowClick,
  emptyMessage = 'No results found.',
  className,
}) {
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})

  const allColumns = useMemo(() => {
    const extra = []
    if (enableSelection) {
      extra.unshift({
        id: 'select',
        size: 40,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      })
    }
    if (rowActions) {
      extra.push({
        id: 'actions',
        size: 56,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => rowActions(row.original, row),
        enableSorting: false,
        enableHiding: false,
      })
    }
    return [...extra, ...columns]
  }, [columns, enableSelection, rowActions])

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const selectedCount = table.getSelectedRowModel().rows.length

  return (
    <div className="space-y-4">
      {toolbar ? toolbar({ table, globalFilter, setGlobalFilter }) : null}

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2.5 animate-fade-in">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="rounded-full">
              {selectedCount} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRowSelection({})}
              className="h-7 px-2 text-muted-foreground"
            >
              <X className="mr-1 h-3.5 w-3.5" /> Clear
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => action.onClick?.(table.getSelectedRowModel().rows.map((r) => r.original))}
              >
                {action.icon ? <action.icon className="mr-1.5 h-3.5 w-3.5" /> : null}
                {action.label}
              </Button>
            ))}
            {enableExport ? (
              <Button variant="outline" size="sm" onClick={() => exportCsv(table, exportFilename)}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={cn('overflow-hidden rounded-xl border bg-card', className)}>
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10 bg-card')}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const dir = header.column.getIsSorted()
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        className="px-4 whitespace-nowrap"
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {dir === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : dir === 'desc' ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className={cn(
                      'hover:bg-muted/40 transition-colors',
                      onRowClick && 'cursor-pointer',
                    )}
                    onClick={onRowClick ? () => onRowClick(row.original, row) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={allColumns.length} className="h-24 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Pagination table={table} totalRows={data.length} />
    </div>
  )
}

export default DataTable
