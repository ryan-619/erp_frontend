import { useMemo, useState } from 'react'
import { FolderTree, Pencil, Plus, Trash2, Search, Tag, AlertTriangle } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentService } from '@/services/student.service'
import { useToast } from '@/hooks/use-toast'

const listValue = (data) => Array.isArray(data) ? data : data?.data || []

function CategoryForm({ initial, onSubmit }) {
  const [category_name, setCategoryName] = useState(initial?.category_name || '')
  return (
    <form id="category-form" onSubmit={(event) => { event.preventDefault(); if (category_name.trim()) onSubmit({ category_name: category_name.trim() }) }} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Category Name *</Label>
        <Input 
          autoFocus 
          required 
          value={category_name} 
          onChange={(e) => setCategoryName(e.target.value)} 
          placeholder="Enter category name (e.g., General, OBC, SC, ST)"
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">This category will be available when creating student records.</p>
      </div>
      <button className="hidden" type="submit" aria-hidden="true">Save</button>
    </form>
  )
}

export default function StudentCategoriesPage() {
  const { toast } = useToast()
  const { data, isLoading, error, refetch } = useAsyncData(() => studentService.categories({ page: 1, limit: 100 }), [])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [remove, setRemove] = useState(null)
  const rows = listValue(data).filter((item) => !search.trim() || String(item.category_name || '').toLowerCase().includes(search.trim().toLowerCase()))
  const columns = useMemo(() => [
    { 
      accessorKey: 'category_name', 
      header: 'Category Name', 
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal">
          {row.original.category_name}
        </Badge>
      )
    },
    { 
      accessorKey: 'createdAt', 
      header: 'Created', 
      cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '—' 
    },
  ], [])
  const save = async (payload, id) => { if (id) await studentService.updateCategory(id, payload); else await studentService.createCategory(payload); toast({ title: id ? 'Category updated' : 'Category created' }); await refetch(); id ? setEdit(null) : setAddOpen(false) }
  const deleteItem = async () => { if (remove) { await studentService.deleteCategory(remove._id); toast({ title: 'Category deleted' }); setRemove(null); await refetch() } }
  return (
    <div className="space-y-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students', to: '/students' }, { label: 'Student Categories' }]} />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Categories</h1>
          <p className="text-muted-foreground">Manage student categories for classification and reporting.</p>
        </div>
        <Button size="lg" onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-5 w-5" />
          Add Category
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            placeholder="Search by category name..." 
            className="pl-10"
          />
        </div>
        
        {isLoading ? (
          <div className="py-12">
            <LoadingSkeleton variant="table" rows={5} cols={3} />
          </div>
        ) : error ? (
          <NoData 
            title="Unable to load categories" 
            description={error.message || 'The backend could not return student categories. Please try again.'} 
            actionLabel="Retry" 
            onAction={refetch}
            icon={AlertTriangle}
          />
        ) : rows.length === 0 ? (
          <NoData 
            title="No student categories" 
            description="Create a category to classify students (e.g., General, OBC, SC, ST)." 
            actionLabel="Add Category" 
            onAction={() => setAddOpen(true)}
            icon={Tag}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={rows} 
            enableExport 
            exportFilename="student-categories" 
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
        title="Add Student Category" 
        description="Create a new student category for classification." 
        width="sm:max-w-md"
        footer={<DrawerFooter formId="category-form" onCancel={() => setAddOpen(false)} submitLabel="Create Category" />}
      >
        {addOpen ? <CategoryForm onSubmit={(payload) => save(payload)} /> : null}
      </Drawer>
      
      <Drawer 
        open={Boolean(edit)} 
        onOpenChange={(open) => !open && setEdit(null)} 
        title="Edit Student Category" 
        description={edit?.category_name}
        width="sm:max-w-md"
        footer={<DrawerFooter formId="category-form" onCancel={() => setEdit(null)} submitLabel="Save Changes" />}
      >
        {edit ? <CategoryForm initial={edit} onSubmit={(payload) => save(payload, edit._id)} /> : null}
      </Drawer>
      
      <DeleteDialog 
        open={Boolean(remove)} 
        onOpenChange={(open) => !open && setRemove(null)} 
        entityName={remove?.category_name || 'category'} 
        onConfirm={deleteItem} 
      />
    </div>
  )
}
