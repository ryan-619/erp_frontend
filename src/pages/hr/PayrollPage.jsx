// ====================================================================
// Module: Human Resources
// Page: Payroll
//
// Purpose:
// Generate, review, and process monthly staff payroll.
//
// Data Source:
// hr.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { DollarSign, Eye, Pencil, Trash2, FileText, Calendar, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { hrService } from '@/services/hr.service'
import { formatCurrency, formatDate, initials } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'staff_name', label: 'Staff Name' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'basic', label: 'Basic' },
  { key: 'allowances', label: 'Allowances' },
  { key: 'deductions', label: 'Deductions' },
  { key: 'net', label: 'Net Salary' },
]

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export default function PayrollPage() {
  const { toast } = useToast()
  const { data: payrolls, isLoading, refetch } = useAsyncData(() => hrService.getPayrolls(), [])
  const { data: staffList, isLoading: staffLoading } = useAsyncData(() => hrService.getStaff(), [])
  
  const [viewRow, setViewRow] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')

  const rows = payrolls || []
  const staff = staffList || []

  const currentYear = new Date().getFullYear()
  const years = useMemo(() => {
    const yearSet = new Set(rows.map(r => r.year))
    if (!yearSet.has(currentYear)) yearSet.add(currentYear)
    return Array.from(yearSet).sort((a, b) => b - a)
  }, [rows, currentYear])

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const staffMember = staff.find(s => s._id === r.staff_id)
    const matchesSearch = !q || (staffMember?.name || '').toLowerCase().includes(q)
    const matchesMonth = monthFilter === 'all' || r.month === parseInt(monthFilter)
    const matchesYear = yearFilter === 'all' || r.year === parseInt(yearFilter)
    return matchesSearch && matchesMonth && matchesYear
  }), [rows, search, monthFilter, yearFilter, staff])

  const stats = useMemo(() => ({
    total: rows.length,
    totalBasic: rows.reduce((s, r) => s + (r.basic || 0), 0),
    totalAllowances: rows.reduce((s, r) => s + (r.allowances || 0), 0),
    totalDeductions: rows.reduce((s, r) => s + (r.deductions || 0), 0),
    totalNet: rows.reduce((s, r) => s + (r.net || 0), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'staff_id',
      header: 'Staff Member',
      cell: ({ row }) => {
        const staffMember = staff.find(s => s._id === row.original.staff_id)
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {initials(staffMember?.name || 'Unknown')}
            </div>
            <div>
              <p className="font-medium hover:underline">{staffMember?.name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{staffMember?.employee_id || '—'}</p>
            </div>
          </button>
        )
      },
    },
    { accessorKey: 'month', header: 'Month', cell: ({ row }) => {
      const month = MONTHS.find(m => m.value === row.original.month)
      return <span>{month?.label || row.original.month}</span>
    }},
    { accessorKey: 'year', header: 'Year', cell: ({ row }) => row.original.year },
    { accessorKey: 'basic', header: 'Basic', cell: ({ row }) => formatCurrency(row.original.basic) },
    { accessorKey: 'allowances', header: 'Allowances', cell: ({ row }) => (
      <span className="font-medium text-success">+{formatCurrency(row.original.allowances)}</span>
    ) },
    { accessorKey: 'deductions', header: 'Deductions', cell: ({ row }) => (
      <span className="font-medium text-destructive">-{formatCurrency(row.original.deductions)}</span>
    ) },
    { accessorKey: 'net', header: 'Net Salary', cell: ({ row }) => (
      <span className="text-base font-bold">{formatCurrency(row.original.net)}</span>
    ) },
  ], [staff])

  const rowActions = (r) => [
    { label: 'View Payslip', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await hrService.updatePayroll(id, payload)
        toast({ title: 'Payroll updated' })
      } else {
        await hrService.createPayroll(payload)
        toast({ title: 'Payroll created' })
      }
      setEditRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to save payroll:', error)
      toast({ title: 'Failed to save payroll', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await hrService.deletePayroll(id)
      toast({ title: 'Payroll deleted' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete payroll:', error)
      toast({ title: 'Failed to delete payroll', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Human Resources' }, { label: 'Payroll' }]} />
      <PageHeader
        title="Payroll Management"
        description="Generate, review, and process monthly staff payroll."
        icon={DollarSign}
        actions={<Button onClick={() => setEditRow({})}><DollarSign className="mr-2 h-4 w-4" /> Add Payroll</Button>}
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Records" value={stats.total} icon={FileText} accent="primary" />
        <StatCard label="Total Basic" value={formatCurrency(stats.totalBasic)} icon={DollarSign} accent="primary" />
        <StatCard label="Total Allowances" value={formatCurrency(stats.totalAllowances)} icon={CheckCircle2} accent="success" />
        <StatCard label="Total Deductions" value={formatCurrency(stats.totalDeductions)} icon={Trash2} accent="destructive" />
        <StatCard label="Total Net Pay" value={formatCurrency(stats.totalNet)} icon={DollarSign} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search staff name…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="payroll" />
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All months</option>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={8} cols={7} />
      ) : filtered.length === 0 ? (
        <NoData title="No payroll data" description="Add payroll records to see them here." actionLabel="Add Payroll" onAction={() => setEditRow({})} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Payslip Detail Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Payslip"
        width="sm:max-w-lg"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const staffMember = staff.find(s => s._id === viewRow.staff_id)
          const month = MONTHS.find(m => m.value === viewRow.month)
          return (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold">{staffMember?.name || 'Unknown'}</h3>
                <p className="text-sm text-muted-foreground">Employee ID: {staffMember?.employee_id || '—'}</p>
                <p className="text-sm text-muted-foreground">{month?.label} {viewRow.year}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Basic Salary</span>
                  <span className="font-semibold">{formatCurrency(viewRow.basic)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Allowances</span>
                  <span className="font-semibold text-success">+{formatCurrency(viewRow.allowances)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Deductions</span>
                  <span className="font-semibold text-destructive">-{formatCurrency(viewRow.deductions)}</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-lg font-semibold">Net Salary</span>
                  <span className="text-xl font-bold">{formatCurrency(viewRow.net)}</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {formatDate(viewRow.createdAt)}</p>
                <p>Updated: {formatDate(viewRow.updatedAt)}</p>
              </div>
            </div>
          )
        })()}
      </Drawer>

      {/* Add/Edit Dialog */}
      <Dialog open={!!editRow} onOpenChange={(o) => { if (!o) setEditRow(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow?._id ? 'Edit Payroll' : 'Add Payroll'}</DialogTitle>
            <DialogDescription>{editRow?._id ? 'Update payroll information' : 'Add a new payroll record'}</DialogDescription>
          </DialogHeader>
          <PayrollForm 
            initial={editRow} 
            staff={staff} 
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => setEditRow(null)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payroll</DialogTitle>
            <DialogDescription>Are you sure you want to delete this payroll record? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteRow._id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── PayrollForm Component ───────────────────────────────────────────────────────
function PayrollForm({ initial, staff, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    staff_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basic: 0,
    allowances: 0,
    deductions: 0,
    net: 0,
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        staff_id: initial.staff_id || '',
        month: initial.month || new Date().getMonth() + 1,
        year: initial.year || new Date().getFullYear(),
        basic: initial.basic || 0,
        allowances: initial.allowances || 0,
        deductions: initial.deductions || 0,
        net: initial.net || 0,
      })
    }
  }, [initial])

  // Calculate net automatically
  useEffect(() => {
    const net = (formData.basic || 0) + (formData.allowances || 0) - (formData.deductions || 0)
    setFormData(prev => ({ ...prev, net }))
  }, [formData.basic, formData.allowances, formData.deductions])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="staff_id">Staff Member *</Label>
        <select
          id="staff_id"
          value={formData.staff_id}
          onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select staff member</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>{s.name} ({s.employee_id || 'No ID'})</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="month">Month *</Label>
          <select
            id="month"
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            type="number"
            min="2020"
            max="2030"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="basic">Basic Salary *</Label>
        <Input
          id="basic"
          type="number"
          min="0"
          step="0.01"
          value={formData.basic}
          onChange={(e) => setFormData({ ...formData, basic: parseFloat(e.target.value) || 0 })}
          required
        />
      </div>
      <div>
        <Label htmlFor="allowances">Allowances</Label>
        <Input
          id="allowances"
          type="number"
          min="0"
          step="0.01"
          value={formData.allowances}
          onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div>
        <Label htmlFor="deductions">Deductions</Label>
        <Input
          id="deductions"
          type="number"
          min="0"
          step="0.01"
          value={formData.deductions}
          onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <Label htmlFor="net">Net Salary (Auto-calculated)</Label>
          <span className="text-lg font-bold">{formatCurrency(formData.net)}</span>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Payroll</Button>
      </DialogFooter>
    </form>
  )
}
