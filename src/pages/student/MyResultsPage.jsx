import { useMemo, useState } from 'react'
import { FileText, Calendar, Award, TrendingUp } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentPortalService } from '@/services/studentPortal.service'
import { examinationService } from '@/services/examination.service'
import { formatDate } from '@/utils/format'

export default function MyResultsPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  // Fetch exam results
  const { data: resultsData, isLoading: resultsLoading } = useAsyncData(
    () => studentId ? studentPortalService.getMyResults(studentId) : Promise.resolve(null),
    [studentId]
  )

  // Filter results by search
  const filteredResults = useMemo(() => {
    if (!Array.isArray(resultsData)) return []
    if (!search) return resultsData
    
    const searchLower = search.toLowerCase()
    return resultsData.filter(entry => {
      const examName = entry.exam_name || entry.name || ''
      const subject = entry.subject_name || entry.subject || ''
      const date = entry.exam_date || entry.date || ''
      
      return (
        examName.toLowerCase().includes(searchLower) ||
        subject.toLowerCase().includes(searchLower) ||
        date.toLowerCase().includes(searchLower)
      )
    })
  }, [resultsData, search])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!Array.isArray(resultsData)) return { total: 0, passed: 0, failed: 0, average: 0 }
    
    const passed = resultsData.filter(r => r.status === 'pass' || r.status === 'passed').length
    const failed = resultsData.filter(r => r.status === 'fail' || r.status === 'failed').length
    const averagePercentage = resultsData.length > 0 
      ? Math.round(resultsData.reduce((sum, r) => {
          const percent = parseFloat(r.percentage) || 0
          return sum + percent
        }, 0) / resultsData.length)
      : 0
    
    return {
      total: resultsData.length,
      passed,
      failed,
      average: averagePercentage,
    }
  }, [resultsData])

  const columns = useMemo(() => [
    {
      accessorKey: "student_data",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original.student_data
        const studentName = student?.name ? `${student.name.first} ${student.name.last}` : (student?.name || 'Unknown')
        return (
          <span className="text-sm font-medium">{studentName}</span>
        )
      },
    },
    {
      accessorKey: "class_section",
      header: "Class/Section",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.class_section || '—'}</span>
      ),
    },
    {
      accessorKey: "exam_group",
      header: "Exam Group",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.exam_group || '—'}</span>
      ),
    },
    {
      accessorKey: "subject_name",
      header: "Subject",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.subject_name || '—'}</span>
      ),
    },
    {
      accessorKey: "marks",
      header: "Marks",
      cell: ({ row }) => {
        const obtained = row.original.marks_obtained || row.original.obtained_marks || 0
        const total = row.original.total_marks || row.original.total || 100
        return (
          <span className="text-sm">{obtained} / {total}</span>
        )
      },
    },
    {
      accessorKey: "percentage",
      header: "Percentage",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.percentage || '—'}%</span>
      ),
    },
  ], [])

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

  if (resultsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Examinations' }, { label: 'My Results' }]} />
        <PageHeader
          title="My Results"
          description="View your exam results."
          icon={FileText}
        />
        <LoadingSkeleton variant="table" rows={6} cols={7} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Examinations' }, { label: 'My Results' }]} />
      <PageHeader
        title="My Results"
        description="View your examination results and performance."
        icon={Award}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Exams"
          value={stats.total}
          icon={FileText}
          accent="primary"
        />
        <StatCard
          label="Passed"
          value={stats.passed}
          icon={Award}
          accent="success"
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          icon={TrendingUp}
          accent="destructive"
        />
        <StatCard
          label="Average Score"
          value={`${stats.average}%`}
          icon={TrendingUp}
          accent="info"
        />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by exam or subject..." className="max-w-sm" />

      {filteredResults.length === 0 ? (
        <NoData 
          title={search ? "No Results Found" : "No Results Available"} 
          description={search ? "Try adjusting your search terms." : "Your exam results will appear here once published."} 
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredResults}
        />
      )}
    </div>
  )
}
