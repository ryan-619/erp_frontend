import { useState } from 'react'
import { Trash2, RefreshCw, Search, CheckSquare2, AlertTriangle } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchBar } from '@/components/SearchBar'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import StatusBadge from '@/components/StatusBadge'
import { DeleteDialog } from '@/components/DeleteDialog'
import { useBulkDelete } from '@/hooks/useStudents'
import { fullName } from '@/utils/format'

export default function BulkDeletePage() {
  const { rows, selected, toggleSelection, selectAll, clearSelection, deleteSelected, isLoading, error, refetch, search, setSearch } = useBulkDelete()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const allSelected = rows.length > 0 && rows.every((student) => selected.some((item) => item._id === student._id))

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteSelected()
      setShowDeleteDialog(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students', to: '/students' }, { label: 'Bulk Delete' }]} />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Delete Students</h1>
          <p className="text-muted-foreground">Select and permanently delete multiple student records at once.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            disabled={!selected.length || isLoading} 
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selected.length})
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <SearchBar 
              value={search} 
              onChange={setSearch} 
              placeholder="Search by name, email, roll number..." 
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <CheckSquare2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{selected.length}</span> selected from <span className="font-semibold text-foreground">{rows.length}</span> visible records
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingSkeleton variant="table" rows={8} cols={9} />
          </div>
        ) : error ? (
          <NoData 
            title="Unable to load students" 
            description={error.message || 'The backend could not return student records. Please try again.'} 
            actionLabel="Retry" 
            onAction={refetch} 
            icon={AlertTriangle}
          />
        ) : rows.length === 0 ? (
          <NoData 
            title="No students available" 
            description="There are no records matching this search criteria." 
            icon={CheckSquare2}
          />
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={allSelected} 
                        onCheckedChange={(checked) => checked ? selectAll() : clearSelection()} 
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((student) => (
                    <TableRow key={student._id} className={selected.some((item) => item._id === student._id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={selected.some((item) => item._id === student._id)} 
                          onCheckedChange={() => toggleSelection(student)}
                          aria-label={`Select ${fullName(student.name)}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.roll_number || '—'}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{fullName(student.name) || 'Unnamed student'}</p>
                          <p className="text-xs text-muted-foreground">{student.email || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{student.guardian?.name || '—'}</TableCell>
                      <TableCell>{student.class_name || '—'}</TableCell>
                      <TableCell>{student.section || '—'}</TableCell>
                      <TableCell>{student.mobile || '—'}</TableCell>
                      <TableCell><StatusBadge status={student.status || 'active'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
        entityName={`${selected.length} student${selected.length > 1 ? 's' : ''}`} 
        onConfirm={handleDelete} 
        loading={deleting}
      />
    </div>
  )
}
