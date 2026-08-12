import { useMemo, useState, useEffect } from 'react'
import {
  CalendarClock, Printer, FileDown, BookOpen, Clock, Coffee, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { academicsService } from '@/services/academics.service'
import { hrService } from '@/services/hr.service'
import { useToast } from '@/hooks/use-toast'

const listValue = (data) => Array.isArray(data) ? data : data?.data || []

const SUBJECT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

const getSubjectColor = (subjectName) => {
  let hash = 0
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % SUBJECT_COLORS.length
  return SUBJECT_COLORS[index]
}

export default function TeachersTimetablePage() {
  const { toast } = useToast()
  const [teacherOptions, setTeacherOptions] = useState([])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  const teachersResult = useAsyncData(() => hrService.getStaff(), [])
  const subjectsResult = useAsyncData(() => academicsService.subjects(), [])
  const classesResult = useAsyncData(() => academicsService.classes(), [])
  const sectionsResult = useAsyncData(() => academicsService.sections(), [])

  useEffect(() => {
    const teachers = listValue(teachersResult.data)
    setTeacherOptions(teachers)
    if (teachers.length && !selectedTeacherId) setSelectedTeacherId(teachers[0]?._id || '')
  }, [teachersResult.data])

  const { data: timetableData, isLoading } = useAsyncData(
    () => selectedTeacherId ? academicsService.teacherTimetable(selectedTeacherId) : Promise.resolve([]),
    [selectedTeacherId],
  )

  const subjects = listValue(subjectsResult.data)
  const classes = listValue(classesResult.data)
  const sections = listValue(sectionsResult.data)
  const timetable = listValue(timetableData)

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId)
    return subject ? subject.subject_name : 'Unknown'
  }

  const getClassName = (classId) => {
    const cls = classes.find(c => c._id === classId)
    return cls ? cls.class_name : 'Unknown'
  }

  const getSectionName = (sectionId) => {
    const section = sections.find(s => s._id === sectionId)
    return section ? section.section_name : 'Unknown'
  }

  // Dynamically extract unique days and periods from the timetable data
  const weekDays = useMemo(() => {
    const uniqueDays = [...new Set(timetable.map(e => e.day))].filter(Boolean)
    // Sort days in proper order
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return uniqueDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
  }, [timetable])

  const periods = useMemo(() => {
    const uniquePeriods = [...new Set(timetable.map(e => e.period))].filter(p => p !== undefined && p !== null)
    return uniquePeriods.sort((a, b) => a - b).map(p => ({ id: p, label: `Period ${p}` }))
  }, [timetable])

  const getEntryForDayAndPeriod = (day, period) => {
    // Only match entries that have both day and period
    return timetable.find(e => e.day === day && e.period === period)
  }

  const stats = useMemo(() => {
    const scheduled = timetable.length
    const totalPeriods = periods.length * weekDays.length
    const free = totalPeriods - scheduled
    const uniqueSubjects = new Set(timetable.map(e => e.subject_id)).size
    return {
      total: totalPeriods,
      scheduled,
      free: Math.max(0, free),
      subjects: uniqueSubjects,
    }
  }, [timetable, periods, weekDays])

  const handlePrint = () => window.print()
  const handleExportPdf = () => {
    toast({ title: 'Exporting PDF', description: 'The teacher timetable will download shortly.' })
  }

  const teacher = teacherOptions.find((t) => t._id === selectedTeacherId)

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Academics', to: '/academics/classes' }, { label: 'Teachers Timetable' }]} />
      <PageHeader
        title="Teachers Timetable"
        description="View weekly teaching schedules and free periods for each teacher."
        icon={CalendarClock}
        actions={
          <>
            <Button variant="outline" onClick={handleExportPdf}><FileDown className="mr-2 h-4 w-4" /> Export PDF</Button>
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Periods" value={stats.total} icon={Clock} accent="primary" />
        <StatCard label="Scheduled" value={stats.scheduled} icon={CalendarClock} accent="success" />
        <StatCard label="Free Periods" value={stats.free} icon={Coffee} accent="warning" />
        <StatCard label="Subjects" value={stats.subjects} icon={BookOpen} accent="chart2" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-lg font-bold text-primary border-2 border-primary/10">
                {teacher?.name ? (
                  <span>{teacher.name.charAt(0)}</span>
                ) : (
                  <User className="h-6 w-6 text-primary/60" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{teacher?.name || 'Select a teacher'}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {teacher?.department && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-xs font-medium text-primary">
                      {teacher.department}
                    </span>
                  )}
                  {teacher?.designation && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground">
                      {teacher.designation}
                    </span>
                  )}
                  {!teacher?.department && !teacher?.designation && (
                    <span className="text-xs text-muted-foreground">No department/designation assigned</span>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-foreground mb-2">Select Teacher</label>
              <select 
                value={selectedTeacherId} 
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Choose a teacher to view timetable</option>
                {teacherOptions.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} {t.department ? `(${t.department})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={8} cols={6} />
      ) : !selectedTeacherId ? (
        <NoData title="No teacher selected" description="Please select a teacher to view their timetable." icon={CalendarClock} />
      ) : timetable.length === 0 ? (
        <NoData title="No timetable found" description="No timetable has been created for this teacher yet." icon={CalendarClock} />
      ) : (
        <Card className="print:shadow-none print:border-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="sticky left-0 z-10 bg-muted/40 p-3 text-left text-xs font-semibold text-muted-foreground">
                      Period / Day
                    </th>
                    {weekDays.map((day) => (
                      <th key={day} className="min-w-[140px] p-3 text-center text-xs font-semibold text-foreground">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period.id} className="border-b last:border-0">
                      <td className="sticky left-0 z-10 bg-card p-3">
                        <p className="text-xs font-semibold">{period.label}</p>
                      </td>
                      {weekDays.map((day) => {
                        const entry = getEntryForDayAndPeriod(day, period.id)
                        if (!entry) {
                          return (
                            <td key={day} className="p-2">
                              <div className="flex h-full min-h-[64px] items-center justify-center rounded-lg border border-dashed bg-muted/20 text-xs font-medium text-muted-foreground/60">
                                Free
                              </div>
                            </td>
                          )
                        }
                        const subjectName = getSubjectName(entry.subject_id)
                        const color = getSubjectColor(subjectName)
                        return (
                          <td key={day} className="p-2">
                            <div
                              className="min-h-[64px] cursor-pointer rounded-lg border p-2 transition-shadow hover:shadow-md"
                              style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
                              onClick={() => toast({ title: subjectName, description: `Class: ${getClassName(entry.class_id)} · Section: ${getSectionName(entry.section_id)}` })}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                                <p className="text-xs font-semibold" style={{ color }}>{subjectName}</p>
                              </div>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {entry.start_time && entry.end_time ? `${entry.start_time} - ${entry.end_time}` : ''}
                              </p>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
