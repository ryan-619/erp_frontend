// ====================================================================
// Module: Student Portal
// Page: My Certificates
//
// Purpose:
// View and download certificates generated for the logged-in student.
//
// Data Source:
// studentPortal.service.js -> certificate.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Award, Download, Eye, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentPortalService } from '@/services/studentPortal.service'
import { formatDate } from '@/utils/format'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'

export default function MyCertificatesPage() {
  const { role, user } = useAuth()
  const { toast } = useToast()

  if (role !== 'student') {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">This page is only accessible to students.</p>
        </div>
      </div>
    )
  }

  const studentId = user?.id || user?.student_id || user?._id

  const { data: certificates, isLoading, refetch } = useAsyncData(
    () => studentPortalService.getMyCertificates(studentId),
    []
  )

  const [search, setSearch] = useState('')
  const [viewRow, setViewRow] = useState(null)

  const rows = certificates || []

  const filtered = useMemo(() => {
    // Apply search filter (service already filtered by student ID)
    const q = search.toLowerCase()
    return rows.filter((r) => {
      return !q ||
        (r.certificate_name || '').toLowerCase().includes(q) ||
        (r.certificate?.certificate_name || '').toLowerCase().includes(q) ||
        (r.issued_by || '').toLowerCase().includes(q)
    })
  }, [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'certificate_name',
      header: 'Certificate',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Award className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">
              {row.original.certificate_name || row.original.certificate?.certificate_name || 'Certificate'}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.issued_by || 'Issued by School'}
            </span>
          </div>
        </button>
      ),
    },
    {
      accessorKey: 'generated_date',
      header: 'Generated Date',
      cell: ({ row }) => formatDate(row.original.generated_date || row.original.createdAt),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewRow(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => handleDownload(row.original)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [])

  const handleDownload = (certificate) => {
    // In a real implementation, this would download the actual certificate
    // For now, we'll show a toast notification
    toast({
      title: 'Download Started',
      description: `Downloading ${certificate.certificate_name || certificate.certificate?.certificate_name || 'Certificate'}`,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Certificates' }, { label: 'My Certificates' }]} />
      <PageHeader
        title="My Certificates"
        description="View and download your certificates."
        icon={Award}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Certificates" value={stats.total} icon={Award} accent="primary" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by certificate name or issuer…" className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData
          title="No certificates found"
          description="You don't have any certificates yet. Certificates will appear here when they are generated by the school."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Certificate Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Award className="h-8 w-8" />
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Certificate Name', value: viewRow.certificate_name || viewRow.certificate?.certificate_name || '—' },
                { label: 'Issued By', value: viewRow.issued_by || 'School Administration' },
                { label: 'Generated Date', value: formatDate(viewRow.generated_date || viewRow.createdAt) },
                { label: 'Certificate ID', value: viewRow._id || '—' },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" onClick={() => setViewRow(null)}>
                Close
              </Button>
              <Button onClick={() => handleDownload(viewRow)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
