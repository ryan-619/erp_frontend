import { useMemo, useState } from 'react'
import { Ban, Pencil, Plus, Trash2, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { SearchBar } from '@/components/SearchBar'
import { DataTable } from '@/components/DataTable'
import { ActionDropdown } from '@/components/ActionDropdown'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { DeleteDialog } from '@/components/DeleteDialog'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useDisableReasons } from '@/hooks/useStudents'

function ReasonForm({ initial, onSubmit }) {
  const [reason, setReason] = useState(initial?.reason || '')
  return (
    <form id="reason-form" onSubmit={(event) => { event.preventDefault(); if (reason.trim()) onSubmit({ reason: reason.trim() }) }} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Disable Reason *</Label>
        <Input 
          autoFocus 
          required 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          placeholder="Enter the reason for disabling a student"
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">This reason will be displayed when a student is disabled.</p>
      </div>
      <button type="submit" className="hidden" aria-hidden="true">Save</button>
    </form>
  )
}

export default function DisableReasonsPage() {
  const { rows, isLoading, error, refetch, search, setSearch, saveReason, deleteReason } = useDisableReasons()
  const [addOpen, setAddOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [remove, setRemove] = useState(null)
  const columns = useMemo(() => [{ accessorKey: 'reason', header: 'Reason' }, { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '—' }], [])
  const save = async (payload, id) => { await saveReason(payload, id); id ? setEdit(null) : setAddOpen(false) }
  const onDelete = async () => { if (remove) { await deleteReason(remove._id); setRemove(null) } }
  return (
    <div className="space-y-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students', to: '/students' }, { label: 'Disable Reasons' }]} />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disable Reasons</h1>
          <p className="text-muted-foreground">Manage reasons for disabling student records.</p>
        </div>
        <Button size="lg" onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-5 w-5" />
          Add Reason
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            placeholder="Search by reason..." 
            className="pl-10"
          />
        </div>
        
        {isLoading ? (
          <div className="py-12">
            <LoadingSkeleton variant="table" rows={5} cols={3} />
          </div>
        ) : error ? (
          <NoData 
            title="Unable to load reasons" 
            description={error.message || 'The backend could not return disable reasons. Please try again.'} 
            actionLabel="Retry" 
            onAction={refetch}
            icon={AlertTriangle}
          />
        ) : rows.length === 0 ? (
          <NoData 
            title="No disable reasons" 
            description="Create a disable reason before adding disabled student records." 
            actionLabel="Add Reason" 
            onAction={() => setAddOpen(true)}
            icon={Ban}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={rows} 
            enableExport 
            exportFilename="disable-reasons" 
            rowActions={(row) => <ActionDropdown actions={[
              { label: 'Edit', icon: Pencil, onClick: () => setEdit(row) }, 
              { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setRemove(row) }
            ]} />} 
          />
        )}
      </div>
      
      <Drawer 
        open={addOpen} 
        onOpenChange={setAddOpen} 
        title="Add Disable Reason" 
        description="Create a new reason for disabling students." 
        width="sm:max-w-md"
        footer={<DrawerFooter formId="reason-form" onCancel={() => setAddOpen(false)} submitLabel="Create Reason" />}
      >
        {addOpen ? <ReasonForm onSubmit={(payload) => save(payload)} /> : null}
      </Drawer>
      
      <Drawer 
        open={Boolean(edit)} 
        onOpenChange={(open) => !open && setEdit(null)} 
        title="Edit Disable Reason" 
        description={edit?.reason}
        width="sm:max-w-md"
        footer={<DrawerFooter formId="reason-form" onCancel={() => setEdit(null)} submitLabel="Save Changes" />}
      >
        {edit ? <ReasonForm initial={edit} onSubmit={(payload) => save(payload, edit._id)} /> : null}
      </Drawer>
      
      <DeleteDialog 
        open={Boolean(remove)} 
        onOpenChange={(open) => !open && setRemove(null)} 
        entityName={remove?.reason || 'reason'} 
        onConfirm={onDelete} 
      />
    </div>
  )
}
