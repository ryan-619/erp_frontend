// ====================================================================
// Module: Front CMS
// Page: Media Manager
//
// Purpose:
// Manage media files (images, videos, PDFs, documents).
//
// Data Source:
// frontCms.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { FileImage, FileVideo, FileText, Eye, Pencil, Trash2, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { frontCmsService } from '@/services/frontCms.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'file_name', label: 'File Name' },
  { key: 'file_type', label: 'File Type' },
  { key: 'file_url', label: 'File URL' },
  { key: 'createdAt', label: 'Created At' },
]

// Helper to determine file icon based on MIME type
const getFileIcon = (fileType) => {
  if (!fileType) return FileImage
  if (fileType.startsWith('image/')) return FileImage
  if (fileType.startsWith('video/')) return FileVideo
  if (fileType.startsWith('application/pdf')) return FileText
  return FileImage
}

// Helper to determine if file is previewable
const isPreviewable = (fileType) => {
  if (!fileType) return false
  return fileType.startsWith('image/') || fileType.startsWith('video/')
}

export default function MediaManagerPage() {
  const { toast } = useToast()
  const { data: media, isLoading, refetch } = useAsyncData(() => frontCmsService.getMedia(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  
  // Loading states for async operations
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const rows = media || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.file_name || '').toLowerCase().includes(q) ||
      (r.file_type || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
    images: rows.filter(r => r.file_type?.startsWith('image/')).length,
    videos: rows.filter(r => r.file_type?.startsWith('video/')).length,
    documents: rows.filter(r => r.file_type?.startsWith('application/pdf') || r.file_type?.includes('document')).length,
  }), [rows])

  // Table columns with file preview
  const columns = useMemo(() => [
    {
      accessorKey: 'file_url',
      header: 'Preview',
      cell: ({ row }) => {
        const fileType = row.original.file_type
        const FileIcon = getFileIcon(fileType)
        const previewable = isPreviewable(fileType)
        
        return (
          <div className="h-16 w-24 overflow-hidden rounded-lg bg-muted">
            {previewable && row.original.file_url ? (
              fileType?.startsWith('image/') ? (
                <img 
                  src={row.original.file_url} 
                  alt={row.original.file_name || 'Media'} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : fileType?.startsWith('video/') ? (
                <video 
                  src={row.original.file_url}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : null
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <FileIcon className="h-6 w-6" />
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'file_name',
      header: 'File',
      cell: ({ row }) => {
        const FileIcon = getFileIcon(row.original.file_type)
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium hover:underline">{row.original.file_name || 'Unnamed'}</span>
              <span className="text-xs text-muted-foreground">{row.original.file_type || 'No type'}</span>
            </div>
          </button>
        )
      },
    },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    ...(r.file_url ? [{ label: 'Download', icon: Download, onClick: () => handleDownload(r) }] : []),
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  // Handle save (create/update) with loading state
  const handleSave = async (payload, file, id) => {
    setIsSaving(true)
    try {
      if (id) {
        await frontCmsService.updateMedia(id, payload)
        toast({ title: 'Media updated successfully' })
        setEditRow(null)
      } else {
        await frontCmsService.createMedia(payload, file)
        toast({ title: 'Media uploaded successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save media:', error)
      toast({ title: 'Failed to save media', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete with loading state
  const handleDelete = async (id) => {
    setIsDeleting(true)
    try {
      await frontCmsService.deleteMedia(id)
      toast({ title: 'Media deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete media:', error)
      toast({ title: 'Failed to delete media', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle download - create download link for Cloudinary URLs
  const handleDownload = (media) => {
    if (!media.file_url) return
    
    try {
      const link = document.createElement('a')
      link.href = media.file_url
      link.download = media.file_name || 'download'
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      
      // For Cloudinary URLs, add download parameter to force download
      if (media.file_url.includes('cloudinary.com')) {
        link.href = media.file_url + (media.file_url.includes('?') ? '&' : '?') + 'dl=1'
      }
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({ title: 'Download started' })
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to opening in new tab
      window.open(media.file_url, '_blank')
      toast({ title: 'Opening file in new tab' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front CMS' }, { label: 'Media Manager' }]} />
      <PageHeader
        title="Media Manager"
        description="Manage media files (images, videos, PDFs, documents)."
        icon={FileImage}
        actions={<Button onClick={() => setAddOpen(true)}><FileImage className="mr-2 h-4 w-4" /> Upload Media</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Files" value={stats.total} icon={FileImage} accent="primary" />
        <StatCard label="Images" value={stats.images} icon={FileImage} accent="success" />
        <StatCard label="Videos" value={stats.videos} icon={FileVideo} accent="warning" />
        <StatCard label="Documents" value={stats.documents} icon={FileText} accent="info" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or type…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="media" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No media found" description="Upload media to get started." actionLabel="Upload Media" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Media' : 'Upload Media'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update media details' : 'Upload a new media file (images, videos, PDFs, documents)'}</DialogDescription>
          </DialogHeader>
          <MediaForm initial={editRow} onSubmit={(payload, file) => handleSave(payload, file, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} isSaving={isSaving} />
        </DialogContent>
      </Dialog>

      {/* View drawer with media preview */}
      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Media Details" width="sm:max-w-2xl" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <div className="space-y-6">
            {/* Media preview */}
            {viewRow.file_url && isPreviewable(viewRow.file_type) && (
              <div className="space-y-2">
                <dt className="text-xs font-medium text-muted-foreground">Preview</dt>
                <div className="overflow-hidden rounded-lg border">
                  {viewRow.file_type?.startsWith('image/') ? (
                    <img 
                      src={viewRow.file_url} 
                      alt={viewRow.file_name || 'Media'} 
                      className="w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : viewRow.file_type?.startsWith('video/') ? (
                    <video 
                      src={viewRow.file_url}
                      controls
                      className="w-full"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : null}
                </div>
              </div>
            )}
            
            {/* File details */}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'File Name', value: viewRow.file_name || '—' },
                { label: 'File Type', value: viewRow.file_type || '—' },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>

            {/* File URL with download link */}
            {viewRow.file_url && (
              <div className="space-y-2">
                <dt className="text-xs font-medium text-muted-foreground">File URL</dt>
                <div className="flex items-center gap-2">
                  <dd className="text-sm font-medium flex-1 line-clamp-1">{viewRow.file_url}</dd>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDownload(viewRow)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Delete confirmation dialog with loading state */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
            <DialogDescription>Are you sure you want to delete this media file? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteRow._id)} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Media form with file preview and loading state
function MediaForm({ initial, onSubmit, onCancel, isSaving }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fileType, setFileType] = useState('')

  // Initialize form based on edit/add mode
  useEffect(() => {
    if (initial) {
      setPreviewUrl(initial.file_url || null)
      setFileType(initial.file_type || '')
    } else {
      setPreviewUrl(null)
      setFileType('')
      setFile(null)
    }
  }, [initial])

  // Handle file selection with preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileType(selectedFile.type || '')
      
      // Create preview for images and videos
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        const objectUrl = URL.createObjectURL(selectedFile)
        setPreviewUrl(objectUrl)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  // Remove selected file
  const handleRemoveFile = () => {
    setFile(null)
    setPreviewUrl(null)
    setFileType('')
  }

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault()
    // Backend auto-generates file_name, file_url, and file_type from the uploaded file
    onSubmit({}, file)
  }

  const FileIcon = getFileIcon(fileType)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="file">File *</Label>
        <div className="space-y-3">
          {/* File preview */}
          {previewUrl && (
            <div className="relative overflow-hidden rounded-lg border">
              {fileType?.startsWith('image/') ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="h-48 w-full object-cover"
                />
              ) : fileType?.startsWith('video/') ? (
                <video 
                  src={previewUrl}
                  controls
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center bg-muted">
                  <FileIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {!initial && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={handleRemoveFile}
                >
                  Remove
                </Button>
              )}
            </div>
          )}
          
          {/* File info display */}
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileIcon className="h-4 w-4" />
              <span>{file.name}</span>
              <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
          
          {/* File input */}
          {!initial && (
            <Input 
              id="file" 
              type="file" 
              onChange={handleFileChange} 
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
              required={!file}
            />
          )}
          
          {initial && (
            <p className="text-xs text-muted-foreground">
              To change the file, delete this media item and upload a new one.
            </p>
          )}
          
          <p className="text-xs text-muted-foreground">
            Supported formats: Images (JPG, PNG, GIF), Videos (MP4, WebM), Documents (PDF, DOC, DOCX, XLS, XLSX)
          </p>
        </div>
      </div>
      
      {/* Form footer with loading state */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button type="submit" disabled={isSaving || !file}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}