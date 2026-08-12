// ====================================================================
// Module: Library
// Page: Issue / Return
//
// Purpose:
// Manage book lending and returns.
//
// Data Source:
// library.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { ArrowLeftRight, Eye, Trash2, Printer, BookOpen, CircleCheck as CheckCircle2, CircleAlert, Clock, RotateCcw, Plus } from 'lucide-react'
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
import { libraryService } from '@/services/library.service'
import { studentService } from '@/services/student.service'
import { hrService } from '@/services/hr.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const EXPORT_COLS = [
  { key: 'book_title', label: 'Book' },
  { key: 'member_name', label: 'Member' },
  { key: 'member_type', label: 'Member Type' },
  { key: 'issue_date', label: 'Issue Date' },
  { key: 'return_date', label: 'Return Date' },
  { key: 'status', label: 'Status' },
]

// Status pill styles
const STATUS_STYLES = {
  issued: 'bg-primary/10 text-primary border-primary/20',
  returned: 'bg-success/10 text-success border-success/20',
}

function IssueStatusPill({ status }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[status] || STATUS_STYLES.issued)}>
      {status}
    </span>
  )
}

export default function IssueReturnPage() {
  const { toast } = useToast()
  const { data: issueReturns, isLoading, refetch } = useAsyncData(() => libraryService.getIssueReturns(), [])
  const { data: books, isLoading: booksLoading } = useAsyncData(() => libraryService.getBookList(), [])
  const { data: students, isLoading: studentsLoading } = useAsyncData(() => studentService.list(), [])
  const { data: staffMembers, isLoading: staffLoading } = useAsyncData(() => hrService.getStaff(), [])
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [memberTypeFilter, setMemberTypeFilter] = useState('all')
  const [issueOpen, setIssueOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = issueReturns || []
  const allBooks = books || []
  const allStudents = students || []
  const allStaff = staffMembers || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const book = allBooks.find(b => b._id === r.book_id)
    const member = r.member_type === 'student' 
      ? allStudents.find(s => s._id === r.member_id)
      : allStaff.find(s => s._id === r.member_id)
    const memberName = member?.name 
      ? (typeof member.name === 'string' ? member.name : `${member.name.first || ''} ${member.name.last || ''}`.trim())
      : ''
    
    const matchesSearch = !q || 
      (book?.title || '').toLowerCase().includes(q) ||
      memberName.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    const matchesMemberType = memberTypeFilter === 'all' || r.member_type === memberTypeFilter
    return matchesSearch && matchesStatus && matchesMemberType
  }), [rows, search, statusFilter, memberTypeFilter, allBooks, allStudents, allStaff])

  const stats = useMemo(() => ({
    total: rows.length,
    issued: rows.filter((r) => r.status === 'issued').length,
    returned: rows.filter((r) => r.status === 'returned').length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'book_id',
      header: 'Book',
      cell: ({ row }) => {
        const book = allBooks.find(b => b._id === row.original.book_id)
        return (
          <button className="flex flex-col text-left" onClick={() => setViewRow(row.original)}>
            <span className="font-medium hover:underline">{book?.title || 'Unknown'}</span>
            <span className="text-xs text-muted-foreground font-mono">{book?.isbn || '—'}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'member_id',
      header: 'Member',
      cell: ({ row }) => {
        const member = row.original.member_type === 'student'
          ? allStudents.find(s => s._id === row.original.member_id)
          : allStaff.find(s => s._id === row.original.member_id)
        const memberName = member?.name 
          ? (typeof member.name === 'string' ? member.name : `${member.name.first || ''} ${member.name.last || ''}`.trim())
          : 'Unknown'
        return (
          <div className="flex flex-col">
            <span className="font-medium">{memberName}</span>
            <Badge variant="outline" className="w-fit capitalize text-xs">{row.original.member_type}</Badge>
          </div>
        )
      },
    },
    { accessorKey: 'issue_date', header: 'Issue Date', cell: ({ row }) => formatDate(row.original.issue_date) },
    { accessorKey: 'return_date', header: 'Return Date', cell: ({ row }) => row.original.return_date ? formatDate(row.original.return_date) : '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <IssueStatusPill status={row.original.status} /> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allBooks, allStudents, allStaff])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: RotateCcw, onClick: () => setEditRow(r) },
    { label: 'Return Book', icon: CheckCircle2, onClick: () => handleReturn(r), disabled: r.status === 'returned' },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await libraryService.updateIssueReturn(id, payload)
        toast({ title: 'Issue record updated' })
      } else {
        await libraryService.createIssueReturn(payload)
        toast({ title: 'Book issued' })
      }
      setIssueOpen(false)
      setEditRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to save issue record:', error)
      toast({ title: 'Failed to save issue record', variant: 'destructive' })
    }
  }

  const handleReturn = async (record) => {
    try {
      await libraryService.updateIssueReturn(record._id, { status: 'returned', return_date: new Date().toISOString() })
      toast({ title: 'Book returned' })
      refetch()
    } catch (error) {
      console.error('Failed to return book:', error)
      toast({ title: 'Failed to return book', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await libraryService.deleteIssueReturn(id)
      toast({ title: 'Issue record deleted' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete issue record:', error)
      toast({ title: 'Failed to delete issue record', variant: 'destructive' })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Library' }, { label: 'Issue / Return' }]} />
      <PageHeader
        title="Issue / Return"
        description="Manage book lending and returns."
        icon={ArrowLeftRight}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button onClick={() => setIssueOpen(true)}><Plus className="mr-2 h-4 w-4" /> Issue Book</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Transactions" value={stats.total} icon={ArrowLeftRight} accent="primary" />
        <StatCard label="Currently Issued" value={stats.issued} icon={BookOpen} accent="chart2" />
        <StatCard label="Returned" value={stats.returned} icon={CheckCircle2} accent="success" />
        <StatCard label="Active Books" value={allBooks.filter(b => b.available > 0).length} icon={CircleAlert} accent="warning" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by book or member…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              book_title: allBooks.find(b => b._id === r.book_id)?.title || 'Unknown',
              member_name: (() => {
                const member = r.member_type === 'student'
                  ? allStudents.find(s => s._id === r.member_id)
                  : allStaff.find(s => s._id === r.member_id)
                return member?.name 
                  ? (typeof member.name === 'string' ? member.name : `${member.name.first || ''} ${member.name.last || ''}`.trim())
                  : 'Unknown'
              })()
            }))} 
            columns={EXPORT_COLS} 
            filename="issue-records" 
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All statuses</option>
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
          </select>
          <select value={memberTypeFilter} onChange={(e) => setMemberTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All members</option>
            <option value="student">Students</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No issue records found" description="Issue a book to get started." actionLabel="Issue Book" onAction={() => setIssueOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Issue/Add/Edit Dialog */}
      <Dialog open={issueOpen || !!editRow} onOpenChange={(o) => { if (!o) { setIssueOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Issue Record' : 'Issue Book'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update issue record details' : 'Issue a book to a library member'}</DialogDescription>
          </DialogHeader>
          <IssueForm 
            initial={editRow} 
            books={allBooks} 
            students={allStudents} 
            staff={allStaff}
            booksLoading={booksLoading}
            studentsLoading={studentsLoading}
            staffLoading={staffLoading}
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setIssueOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Issue Record Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const book = allBooks.find(b => b._id === viewRow.book_id)
          const member = viewRow.member_type === 'student'
            ? allStudents.find(s => s._id === viewRow.member_id)
            : allStaff.find(s => s._id === viewRow.member_id)
          const memberName = member?.name 
            ? (typeof member.name === 'string' ? member.name : `${member.name.first || ''} ${member.name.last || ''}`.trim())
            : 'Unknown'
          
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Book', value: book?.title || 'Unknown' },
                { label: 'ISBN', value: book?.isbn || '—' },
                { label: 'Member', value: memberName },
                { label: 'Member Type', value: <Badge variant="outline" className="capitalize">{viewRow.member_type}</Badge> },
                { label: 'Issue Date', value: formatDate(viewRow.issue_date) },
                { label: 'Return Date', value: viewRow.return_date ? formatDate(viewRow.return_date) : '—' },
                { label: 'Status', value: <IssueStatusPill status={viewRow.status} /> },
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
            <DialogTitle>Delete Issue Record</DialogTitle>
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

// ─── IssueForm Component ───────────────────────────────────────────────────────
function IssueForm({ initial, books, students, staff, booksLoading, studentsLoading, staffLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    book_id: '',
    member_type: 'student',
    member_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    return_date: '',
    status: 'issued',
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        book_id: initial.book_id || '',
        member_type: initial.member_type || 'student',
        member_id: initial.member_id || '',
        issue_date: initial.issue_date ? initial.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
        return_date: initial.return_date ? initial.return_date.split('T')[0] : '',
        status: initial.status || 'issued',
      })
    } else {
      setFormData({
        book_id: books[0]?._id || '',
        member_type: 'student',
        member_id: students[0]?._id || '',
        issue_date: new Date().toISOString().split('T')[0],
        return_date: '',
        status: 'issued',
      })
    }
  }, [initial, books, students])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="book_id">Book *</Label>
        <select
          id="book_id"
          value={formData.book_id}
          onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
          disabled={booksLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select book</option>
          {books.map((b) => (
            <option key={b._id} value={b._id}>{b.title} (Available: {b.available})</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="member_type">Member Type *</Label>
        <select
          id="member_type"
          value={formData.member_type}
          onChange={(e) => setFormData({ ...formData, member_type: e.target.value, member_id: '' })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="student">Student</option>
          <option value="staff">Staff</option>
        </select>
      </div>
      <div>
        <Label htmlFor="member_id">Member *</Label>
        <select
          id="member_id"
          value={formData.member_id}
          onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
          disabled={formData.member_type === 'student' ? studentsLoading : staffLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select member</option>
          {formData.member_type === 'student' 
            ? students.map((s) => {
                const studentName = s.name 
                  ? (typeof s.name === 'string' ? s.name : `${s.name.first || ''} ${s.name.last || ''}`.trim())
                  : 'Unknown'
                return <option key={s._id} value={s._id}>{studentName} ({s.student_id || 'No ID'})</option>
              })
            : staff.map((s) => {
                const staffName = s.name 
                  ? (typeof s.name === 'string' ? s.name : `${s.name.first || ''} ${s.name.last || ''}`.trim())
                  : 'Unknown'
                return <option key={s._id} value={s._id}>{staffName} ({s.employee_id || 'No ID'})</option>
              })
          }
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <Label htmlFor="return_date">Return Date</Label>
          <Input
            id="return_date"
            type="date"
            value={formData.return_date}
            onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="issued">Issued</option>
          <option value="returned">Returned</option>
        </select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Update' : 'Issue'} Book</Button>
      </DialogFooter>
    </form>
  )
}
