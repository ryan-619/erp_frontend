// ====================================================================
// Module: Human Resources
// Page: Teachers Rating
//
// Purpose:
// View and manage performance evaluations for teaching staff.
//
// Data Source:
// hr.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Star, TrendingUp, Award, Users, Eye, Pencil, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { formatDate, initials } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const EXPORT_COLS = [
  { key: 'teacher_name', label: 'Teacher' },
  { key: 'rating', label: 'Rating' },
  { key: 'comments', label: 'Comments' },
  { key: 'createdAt', label: 'Rated On' },
]

// Renders filled/empty stars for a numeric rating out of 5
function StarRating({ value, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={cn('h-3.5 w-3.5', i < Math.round(value) ? 'fill-warning text-warning' : 'text-muted-foreground/30')} />
      ))}
      <span className="ml-1 text-xs font-medium">{Number(value).toFixed(1)}</span>
    </div>
  )
}

// Color class based on rating score — green for high, yellow for medium, red for low
function ratingColor(val) {
  if (val >= 4) return 'text-success'
  if (val >= 3) return 'text-warning'
  return 'text-destructive'
}

export default function TeachersRatingPage() {
  const { toast } = useToast()
  const { data: ratings, isLoading, refetch } = useAsyncData(() => hrService.getTeacherRatings(), [])
  const { data: staffList, isLoading: staffLoading } = useAsyncData(() => hrService.getStaff(), [])
  
  const [search, setSearch] = useState('')
  const [viewRow, setViewRow] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = ratings || []
  const staff = staffList || []

  const filtered = useMemo(() => rows.filter((r) => {
    const teacher = staff.find(s => s._id === r.teacher_id)
    const q = search.toLowerCase()
    return !q || (teacher?.name || '').toLowerCase().includes(q)
  }), [rows, search, staff])

  const stats = useMemo(() => {
    if (!rows.length) return { avg: 0, excellent: 0, total: 0 }
    const avg = rows.reduce((s, r) => s + Number(r.rating), 0) / rows.length
    return {
      avg: avg.toFixed(2),
      excellent: rows.filter((r) => Number(r.rating) >= 4).length,
      total: rows.length,
    }
  }, [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'teacher_id',
      header: 'Teacher',
      cell: ({ row }) => {
        const teacher = staff.find(s => s._id === row.original.teacher_id)
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(teacher?.name || 'Unknown')}
            </div>
            <div>
              <p className="font-medium hover:underline">{teacher?.name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{teacher?.designation_id || '—'}</p>
            </div>
          </button>
        )
      },
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <span className={cn('text-base font-bold', ratingColor(Number(row.original.rating)))}>
          <StarRating value={row.original.rating} />
        </span>
      ),
    },
    { accessorKey: 'comments', header: 'Comments', cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{row.original.comments || '—'}</span>
    ) },
    { accessorKey: 'createdAt', header: 'Rated On', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [staff])

  const rowActions = (r) => [
    { label: 'View Details', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await hrService.updateTeacherRating(id, payload)
        toast({ title: 'Rating updated' })
      } else {
        await hrService.createTeacherRating(payload)
        toast({ title: 'Rating created' })
      }
      setEditRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to save rating:', error)
      toast({ title: 'Failed to save rating', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await hrService.deleteTeacherRating(id)
      toast({ title: 'Rating deleted' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete rating:', error)
      toast({ title: 'Failed to delete rating', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Human Resources' }, { label: 'Teachers Rating' }]} />
      <PageHeader
        title="Teachers Rating"
        description="View and manage performance evaluations for teaching staff."
        icon={Star}
        actions={<Button onClick={() => setEditRow({})}><Star className="mr-2 h-4 w-4" /> Add Rating</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Rated" value={stats.total} icon={Users} accent="primary" />
        <StatCard label="Avg Overall Rating" value={stats.avg} icon={TrendingUp} accent="chart2" />
        <StatCard label="Excellent (≥ 4.0)" value={stats.excellent} icon={Award} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search teacher name…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="teachers-rating" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No ratings found" description="Add teacher ratings to see them here." actionLabel="Add Rating" onAction={() => setEditRow({})} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Rating Detail Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Rating Details"
        width="sm:max-w-lg"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const teacher = staff.find(s => s._id === viewRow.teacher_id)
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {initials(teacher?.name || 'Unknown')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{teacher?.name || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground">{teacher?.designation_id || '—'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Overall Rating</span>
                  <span className={cn('text-2xl font-bold', ratingColor(Number(viewRow.rating)))}>
                    <StarRating value={viewRow.rating} />
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Comments</span>
                  <p className="mt-1 text-sm">{viewRow.comments || 'No comments provided'}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Rated On: {formatDate(viewRow.createdAt)}</p>
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
            <DialogTitle>{editRow?._id ? 'Edit Rating' : 'Add Rating'}</DialogTitle>
            <DialogDescription>{editRow?._id ? 'Update the teacher rating' : 'Add a new teacher rating'}</DialogDescription>
          </DialogHeader>
          <RatingForm 
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
            <DialogTitle>Delete Rating</DialogTitle>
            <DialogDescription>Are you sure you want to delete this rating? This action cannot be undone.</DialogDescription>
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

// ─── RatingForm Component ───────────────────────────────────────────────────────
function RatingForm({ initial, staff, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    teacher_id: '',
    rater_id: '',
    rating: 5,
    comments: '',
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        teacher_id: initial.teacher_id || '',
        rater_id: initial.rater_id || '',
        rating: initial.rating || 5,
        comments: initial.comments || '',
      })
    } else {
      setFormData({
        teacher_id: staff[0]?._id || '',
        rater_id: staff[0]?._id || '',
        rating: 5,
        comments: '',
      })
    }
  }, [initial, staff])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="teacher_id">Teacher *</Label>
        <select
          id="teacher_id"
          value={formData.teacher_id}
          onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select teacher</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="rater_id">Rater *</Label>
        <select
          id="rater_id"
          value={formData.rater_id}
          onChange={(e) => setFormData({ ...formData, rater_id: e.target.value })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select rater</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="rating">Rating (1-5) *</Label>
        <div className="flex items-center gap-4 mt-2">
          <Input
            id="rating"
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-2xl font-bold w-12 text-center">{formData.rating}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Poor</span>
          <span>Excellent</span>
        </div>
      </div>
      <div>
        <Label htmlFor="comments">Comments</Label>
        <Textarea
          id="comments"
          value={formData.comments}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          placeholder="Provide feedback or comments"
          rows={4}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Rating</Button>
      </DialogFooter>
    </form>
  )
}
