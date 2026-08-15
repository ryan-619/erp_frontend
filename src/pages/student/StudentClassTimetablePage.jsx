import { useMemo, useState, useEffect } from 'react'
import { BookOpen, CalendarClock } from 'lucide-react'
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
import { academicsService } from '@/services/academics.service'
import apiClient from '@/services/api'

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function StudentClassTimetablePage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  // Fetch student profile to get class/section
  const { data: profile, isLoading: profileLoading } = useAsyncData(
    () => studentId ? studentPortalService.getMyProfile(studentId) : Promise.resolve(null),
    [studentId]
  )

  const studentClass = profile?.class_name || profile?.class
  const studentSection = profile?.section

  // Fetch timetable data
  const { data: timetableData, isLoading: timetableLoading } = useAsyncData(
    () => studentClass ? studentPortalService.getClassTimetable(studentClass) : Promise.resolve(null),
    [studentClass]
  )

  // Fetch reference data for displaying names
  const [classOptions, setClassOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])
  const [subjectOptions, setSubjectOptions] = useState([])
  const [teacherOptions, setTeacherOptions] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classRes, sectionRes, subjectRes, teacherRes] = await Promise.all([
          academicsService.classes(),
          academicsService.sections(),
          academicsService.subjects(),
          apiClient.get("/hr/staff-directory"),
        ])
        setClassOptions(classRes || [])
        setSectionOptions(sectionRes || [])
        setSubjectOptions(subjectRes || [])
        setTeacherOptions(teacherRes || [])
      } catch (err) {
        // Error handling
      }
    }
    loadData()
  }, [])

  // Build lookup maps
  const classMap = useMemo(() => {
    const map = {}
    classOptions.forEach(c => map[c._id] = c)
    return map
  }, [classOptions])

  const sectionMap = useMemo(() => {
    const map = {}
    sectionOptions.forEach(s => map[s._id] = s)
    return map
  }, [sectionOptions])

  const subjectMap = useMemo(() => {
    const map = {}
    subjectOptions.forEach(s => map[s._id] = s)
    return map
  }, [subjectOptions])

  const teacherMap = useMemo(() => {
    const map = {}
    teacherOptions.forEach(t => map[t._id] = t)
    return map
  }, [teacherOptions])

  // Filter timetable by search
  const filteredTimetable = useMemo(() => {
    if (!Array.isArray(timetableData)) return []
    if (!search) return timetableData
    
    const searchLower = search.toLowerCase()
    return timetableData.filter(entry => {
      const subject = subjectMap[entry.subject_id]?.subject_name || ''
      const teacher = teacherMap[entry.teacher_id]?.name || ''
      const day = entry.day || ''
      const cls = classMap[entry.class_id]?.class_name || ''
      const section = sectionMap[entry.section_id]?.section_name || ''
      
      return (
        subject.toLowerCase().includes(searchLower) ||
        teacher.toLowerCase().includes(searchLower) ||
        day.toLowerCase().includes(searchLower) ||
        cls.toLowerCase().includes(searchLower) ||
        section.toLowerCase().includes(searchLower)
      )
    })
  }, [timetableData, search, subjectMap, teacherMap, classMap, sectionMap])

  // Sort by day and period
  const sortedTimetable = useMemo(() => {
    return [...filteredTimetable].sort((a, b) => {
      const dayA = DAYS_ORDER.indexOf(a.day)
      const dayB = DAYS_ORDER.indexOf(b.day)
      if (dayA !== dayB) return dayA - dayB
      return (a.period || 0) - (b.period || 0)
    })
  }, [filteredTimetable])

  const columns = useMemo(() => [
    {
      accessorKey: "day",
      header: "Day",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.day || '—'}</span>
      ),
    },
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
          {row.original.period || '—'}
        </div>
      ),
    },
    {
      accessorKey: "subject_id",
      header: "Subject",
      cell: ({ row }) => {
        const subject = subjectMap[row.original.subject_id]
        return subject?.subject_name || 'Unknown'
      },
    },
    {
      accessorKey: "teacher_id",
      header: "Teacher",
      cell: ({ row }) => {
        const teacher = teacherMap[row.original.teacher_id]
        return teacher?.name || 'Unknown'
      },
    },
    {
      accessorKey: "start_time",
      header: "Time",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.start_time || '—'} - {row.original.end_time || '—'}
        </span>
      ),
    },
  ], [subjectMap, teacherMap])

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

  if (profileLoading || timetableLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Academics' }, { label: 'Class Timetable' }]} />
        <PageHeader
          title="Class Timetable"
          description="View your class schedule."
          icon={BookOpen}
        />
        <LoadingSkeleton variant="table" rows={6} cols={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Academics' }, { label: 'Class Timetable' }]} />
      <PageHeader
        title="Class Timetable"
        description={
          studentClass 
            ? `Your weekly schedule for ${studentClass}${studentSection ? ` - ${studentSection}` : ''}`
            : 'View your class schedule.'
        }
        icon={BookOpen}
      />

      {!studentClass ? (
        <div className="rounded-lg border border-warning/50 bg-warning/5 p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-warning mb-4" />
          <h3 className="text-lg font-semibold mb-2">Class Information Not Available</h3>
          <p className="text-sm text-muted-foreground">
            Your class information is not set in your profile. Please contact administration to update your profile.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              label="Total Periods"
              value={sortedTimetable.length}
              icon={CalendarClock}
              accent="primary"
            />
            <StatCard
              label="Showing"
              value={filteredTimetable.length}
              icon={BookOpen}
              accent="success"
            />
          </div>

          <SearchBar value={search} onChange={setSearch} placeholder="Search by subject, teacher, or day..." className="max-w-sm" />

          {filteredTimetable.length === 0 ? (
            <NoData 
              title={search ? "No Results Found" : "No Timetable Available"} 
              description={search ? "Try adjusting your search terms." : "Your class timetable has not been published yet. Please check back later."} 
            />
          ) : (
            <DataTable
              columns={columns}
              data={sortedTimetable}
            />
          )}
        </>
      )}
    </div>
  )
}
