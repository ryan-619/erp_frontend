// ====================================================================
// Module: Inventory
// Page: Issue Item
//
// Purpose:
// Issue inventory items to students and staff.
//
// Data Source:
// inventory.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { ClipboardList, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { inventoryService } from '@/services/inventory.service'
import { studentService } from '@/services/student.service'
import { hrService } from '@/services/hr.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'item_name', label: 'Item' },
  { key: 'issued_to_type', label: 'Type' },
  { key: 'issued_to_name', label: 'Issued To' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'issue_date', label: 'Issue Date' },
  { key: 'createdAt', label: 'Created At' },
]

export default function IssueItemPage() {
  const { toast } = useToast()
  const { data: issueItems, isLoading, refetch } = useAsyncData(() => inventoryService.getIssueItems(), [])
  const { data: items, isLoading: itemsLoading } = useAsyncData(() => inventoryService.getItems(), [])
  const { data: students, isLoading: studentsLoading } = useAsyncData(() => studentService.list(), [])
  const { data: staff, isLoading: staffLoading } = useAsyncData(() => hrService.getStaff(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = issueItems || []
  const allItems = items || []
  const allStudents = students || []
  const allStaff = staff || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const item = allItems.find(i => i._id === r.item_id)
    let issuedToName = ''
    if (r.issued_to_type === 'student') {
      const student = allStudents.find(s => s._id === r.issued_to_id)
      if (student) {
        if (typeof student === 'string') {
          issuedToName = student
        } else if (student?.name) {
          const firstName = student.name.first || ''
          const lastName = student.name.last || ''
          issuedToName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'
        } else {
          issuedToName = student?.full_name || student?.first_name || 'Unknown'
        }
      }
    } else if (r.issued_to_type === 'staff') {
      const staffMember = allStaff.find(s => s._id === r.issued_to_id)
      issuedToName = typeof staffMember === 'string' ? staffMember : staffMember?.full_name || staffMember?.first_name || 'Unknown'
    }
    return !q || 
      (item?.item_name || '').toLowerCase().includes(q) ||
      issuedToName.toLowerCase().includes(q) ||
      (r.issued_to_type || '').toLowerCase().includes(q)
  }), [rows, search, allItems, allStudents, allStaff])

  const stats = useMemo(() => ({
    total: rows.length,
    totalIssued: rows.reduce((sum, r) => sum + (r.quantity || 0), 0),
    toStudents: rows.filter(r => r.issued_to_type === 'student').length,
    toStaff: rows.filter(r => r.issued_to_type === 'staff').length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'item_id',
      header: 'Item',
      cell: ({ row }) => {
        const item = allItems.find(i => i._id === row.original.item_id)
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-4 w-4" />
            </div>
            <span className="font-medium hover:underline">{item?.item_name || 'Unknown'}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'issued_to_type',
      header: 'Type',
      cell: ({ row }) => <Badge variant={row.original.issued_to_type === 'student' ? 'secondary' : 'outline'}>{row.original.issued_to_type || '—'}</Badge>,
    },
    {
      accessorKey: 'issued_to_id',
      header: 'Issued To',
      cell: ({ row }) => {
        let name = 'Unknown'
        if (row.original.issued_to_type === 'student') {
          const student = allStudents.find(s => s._id === row.original.issued_to_id)
          if (student) {
            if (typeof student === 'string') {
              name = student
            } else if (student?.name) {
              const firstName = student.name.first || ''
              const lastName = student.name.last || ''
              name = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'
            } else {
              name = student?.full_name || student?.first_name || 'Unknown'
            }
          }
        } else if (row.original.issued_to_type === 'staff') {
          const staffMember = allStaff.find(s => s._id === row.original.issued_to_id)
          name = typeof staffMember === 'string' ? staffMember : staffMember?.full_name || staffMember?.first_name || 'Unknown'
        }
        return <span className="text-sm">{name}</span>
      },
    },
    { accessorKey: 'quantity', header: 'Quantity', cell: ({ row }) => `${row.original.quantity || 0}` },
    { accessorKey: 'issue_date', header: 'Issue Date', cell: ({ row }) => formatDate(row.original.issue_date) },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allItems, allStudents, allStaff])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await inventoryService.updateIssueItem(id, payload)
        toast({ title: 'Issue updated successfully' })
        setEditRow(null)
      } else {
        await inventoryService.createIssueItem(payload)
        toast({ title: 'Item issued successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save issue:', error)
      toast({ title: 'Failed to save issue', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await inventoryService.deleteIssueItem(id)
      toast({ title: 'Issue deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete issue:', error)
      toast({ title: 'Failed to delete issue', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Inventory' }, { label: 'Issue Item' }]} />
      <PageHeader
        title="Issue Item"
        description="Issue inventory items to students and staff."
        icon={ClipboardList}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Issue Item</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Issues" value={stats.total} icon={ClipboardList} accent="primary" />
        <StatCard label="Total Issued Qty" value={stats.totalIssued} icon={ClipboardList} accent="success" />
        <StatCard label="To Students" value={stats.toStudents} icon={ClipboardList} accent="blue" />
        <StatCard label="To Staff" value={stats.toStaff} icon={ClipboardList} accent="purple" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by item, name, or type…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => {
              let issuedToName = 'Unknown'
              if (r.issued_to_type === 'student') {
                const student = allStudents.find(s => s._id === r.issued_to_id)
                if (student) {
                  if (typeof student === 'string') {
                    issuedToName = student
                  } else if (student?.name) {
                    const firstName = student.name.first || ''
                    const lastName = student.name.last || ''
                    issuedToName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'
                  } else {
                    issuedToName = student?.full_name || student?.first_name || 'Unknown'
                  }
                }
              } else if (r.issued_to_type === 'staff') {
                const staffMember = allStaff.find(s => s._id === r.issued_to_id)
                issuedToName = typeof staffMember === 'string' ? staffMember : staffMember?.full_name || staffMember?.first_name || 'Unknown'
              }
              return {
                ...r,
                item_name: allItems.find(i => i._id === r.item_id)?.item_name || 'Unknown',
                issued_to_name: issuedToName,
              }
            })} 
            columns={EXPORT_COLS} 
            filename="issue-items" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No issues found" description="Issue an item to get started." actionLabel="Issue Item" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Issue' : 'Issue Item'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update issue details' : 'Issue an item to a student or staff member'}</DialogDescription>
          </DialogHeader>
          <IssueItemForm 
            initial={editRow} 
            items={allItems}
            students={allStudents}
            staff={allStaff}
            itemsLoading={itemsLoading}
            studentsLoading={studentsLoading}
            staffLoading={staffLoading}
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setAddOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Issue Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const item = allItems.find(i => i._id === viewRow.item_id)
          let issuedToName = 'Unknown'
          if (viewRow.issued_to_type === 'student') {
            const student = allStudents.find(s => s._id === viewRow.issued_to_id)
            if (student) {
              if (typeof student === 'string') {
                issuedToName = student
              } else if (student?.name) {
                const firstName = student.name.first || ''
                const lastName = student.name.last || ''
                issuedToName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'
              } else {
                issuedToName = student?.full_name || student?.first_name || 'Unknown'
              }
            }
          } else if (viewRow.issued_to_type === 'staff') {
            const staffMember = allStaff.find(s => s._id === viewRow.issued_to_id)
            issuedToName = typeof staffMember === 'string' ? staffMember : staffMember?.full_name || staffMember?.first_name || 'Unknown'
          }
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Item', value: item?.item_name || 'Unknown' },
                { label: 'Type', value: viewRow.issued_to_type || '—' },
                { label: 'Issued To', value: issuedToName },
                { label: 'Quantity', value: viewRow.quantity || 0 },
                { label: 'Issue Date', value: formatDate(viewRow.issue_date) },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
                { label: 'Updated', value: formatDate(viewRow.updatedAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          )
        })()}
      </Drawer>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Issue</DialogTitle>
            <DialogDescription>Are you sure you want to delete this issue record? This action cannot be undone.</DialogDescription>
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

function IssueItemForm({ initial, items, students, staff, itemsLoading, studentsLoading, staffLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    item_id: '',
    issued_to_type: 'student',
    issued_to_id: '',
    quantity: '',
    issue_date: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        item_id: initial.item_id || '',
        issued_to_type: initial.issued_to_type || 'student',
        issued_to_id: initial.issued_to_id || '',
        quantity: initial.quantity || '',
        issue_date: initial.issue_date ? initial.issue_date.split('T')[0] : '',
      })
    } else {
      setFormData({
        item_id: items[0]?._id || '',
        issued_to_type: 'student',
        issued_to_id: students[0]?._id || '',
        quantity: '',
        issue_date: new Date().toISOString().split('T')[0],
      })
    }
  }, [initial, items, students])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      quantity: Number(formData.quantity) || 0,
    })
  }

  const getIssuedToOptions = () => {
    if (formData.issued_to_type === 'student') {
      return students.map(s => ({
        value: s._id,
        label: typeof s === 'string' ? s : s?.name ? `${s.name.first || ''} ${s.name.last || ''}`.trim() : s.full_name || s.first_name || 'Unknown',
      }))
    } else {
      return staff.map(s => ({
        value: s._id,
        label: typeof s === 'string' ? s : s.full_name || s.first_name || 'Unknown',
      }))
    }
  }

  const issuedToOptions = getIssuedToOptions()
  const issuedToLoading = formData.issued_to_type === 'student' ? studentsLoading : staffLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="item_id">Item *</Label>
        <select
          id="item_id"
          value={formData.item_id}
          onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
          disabled={itemsLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select item</option>
          {items.map((i) => (
            <option key={i._id} value={i._id}>{i.item_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="issued_to_type">Issue To *</Label>
        <select
          id="issued_to_type"
          value={formData.issued_to_type}
          onChange={(e) => setFormData({ ...formData, issued_to_type: e.target.value, issued_to_id: '' })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="student">Student</option>
          <option value="staff">Staff</option>
        </select>
      </div>
      <div>
        <Label htmlFor="issued_to_id">{formData.issued_to_type === 'student' ? 'Student' : 'Staff'} *</Label>
        <select
          id="issued_to_id"
          value={formData.issued_to_id}
          onChange={(e) => setFormData({ ...formData, issued_to_id: e.target.value })}
          disabled={issuedToLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select {formData.issued_to_type === 'student' ? 'student' : 'staff'}</option>
          {issuedToOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="quantity">Quantity *</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="issue_date">Issue Date *</Label>
        <Input
          id="issue_date"
          type="date"
          value={formData.issue_date}
          onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
          required
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
