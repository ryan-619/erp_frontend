import { useMemo, useState } from 'react'
import { Home, Pencil, Plus, Trash2, Search, Palette, AlertTriangle } from 'lucide-react'
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
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentService } from '@/services/student.service'
import { useToast } from '@/hooks/use-toast'

const listValue = (data) => Array.isArray(data) ? data : data?.data || []

function HouseForm({ initial, onSubmit }) {
  const [form, setForm] = useState({ house_name: initial?.house_name || '', house_color: initial?.house_color || '' })
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  
  return (
    <form id="house-form" onSubmit={(event) => { event.preventDefault(); if (form.house_name.trim()) onSubmit({ house_name: form.house_name.trim(), house_color: form.house_color }) }} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">House Name *</Label>
        <Input 
          autoFocus 
          required 
          value={form.house_name} 
          onChange={(e) => set('house_name', e.target.value)} 
          placeholder="Enter house name (e.g., Red House, Blue House)"
          className="h-10"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium">House Color</Label>
        <div className="flex items-center gap-3">
          <Input 
            value={form.house_color} 
            onChange={(e) => set('house_color', e.target.value)} 
            placeholder="e.g. #ef4444 or Red"
            className="h-10 flex-1"
          />
          {form.house_color && (
            <div 
              className="h-10 w-10 rounded-lg border-2 border-border shadow-sm" 
              style={{ backgroundColor: form.house_color }}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">Enter a hex color code (e.g., #ef4444) or color name.</p>
      </div>
      
      <button className="hidden" type="submit" aria-hidden="true">Save</button>
    </form>
  )
}

export default function StudentHousesPage() {
  const { toast } = useToast()
  const { data, isLoading, error, refetch } = useAsyncData(() => studentService.houses({ page: 1, limit: 100 }), [])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [remove, setRemove] = useState(null)
  const rows = listValue(data).filter((item) => !search.trim() || String(item.house_name || '').toLowerCase().includes(search.trim().toLowerCase()))
  const columns = useMemo(() => [
    { 
      accessorKey: 'house_name', 
      header: 'House Name', 
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div 
            className="h-8 w-8 rounded-lg border-2" 
            style={{ backgroundColor: row.original.house_color || 'transparent' }}
          />
          <span className="font-medium">{row.original.house_name}</span>
        </div>
      )
    },
    { 
      accessorKey: 'house_color', 
      header: 'House Color', 
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: row.original.house_color || 'transparent' }} />
          <span className="text-sm">{row.original.house_color || '—'}</span>
        </div>
      )
    },
    { 
      accessorKey: 'createdAt', 
      header: 'Created', 
      cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '—' 
    },
  ], [])
  const save = async (payload, id) => { if (id) await studentService.updateHouse(id, payload); else await studentService.createHouse(payload); toast({ title: id ? 'House updated' : 'House created' }); await refetch(); id ? setEdit(null) : setAddOpen(false) }
  const deleteItem = async () => { if (remove) { await studentService.deleteHouse(remove._id); toast({ title: 'House deleted' }); setRemove(null); await refetch() } }
  return (
    <div className="space-y-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students', to: '/students' }, { label: 'Student Houses' }]} />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Houses</h1>
          <p className="text-muted-foreground">Manage student houses for intra-school competitions and activities.</p>
        </div>
        <Button size="lg" onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-5 w-5" />
          Add House
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            placeholder="Search by house name..." 
            className="pl-10"
          />
        </div>
        
        {isLoading ? (
          <div className="py-12">
            <LoadingSkeleton variant="table" rows={5} cols={4} />
          </div>
        ) : error ? (
          <NoData 
            title="Unable to load houses" 
            description={error.message || 'The backend could not return student houses. Please try again.'} 
            actionLabel="Retry" 
            onAction={refetch}
            icon={AlertTriangle}
          />
        ) : rows.length === 0 ? (
          <NoData 
            title="No student houses" 
            description="Create a house to assign students for competitions and activities." 
            actionLabel="Add House" 
            onAction={() => setAddOpen(true)}
            icon={Home}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={rows} 
            enableExport 
            exportFilename="student-houses" 
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
        title="Add Student House" 
        description="Create a new house for student grouping and competitions." 
        width="sm:max-w-md"
        footer={<DrawerFooter formId="house-form" onCancel={() => setAddOpen(false)} submitLabel="Create House" />}
      >
        {addOpen ? <HouseForm onSubmit={(payload) => save(payload)} /> : null}
      </Drawer>
      
      <Drawer 
        open={Boolean(edit)} 
        onOpenChange={(open) => !open && setEdit(null)} 
        title="Edit Student House" 
        description={edit?.house_name}
        width="sm:max-w-md"
        footer={<DrawerFooter formId="house-form" onCancel={() => setEdit(null)} submitLabel="Save Changes" />}
      >
        {edit ? <HouseForm initial={edit} onSubmit={(payload) => save(payload, edit._id)} /> : null}
      </Drawer>
      
      <DeleteDialog 
        open={Boolean(remove)} 
        onOpenChange={(open) => !open && setRemove(null)} 
        entityName={remove?.house_name || 'house'} 
        onConfirm={deleteItem} 
      />
    </div>
  )
}
