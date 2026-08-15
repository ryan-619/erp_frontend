import { useMemo, useState, useCallback } from 'react'
import { Printer, RefreshCw, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'
import { studentPortalService } from '@/services/studentPortal.service'
import { examinationService } from '@/services/examination.service'
import { academicsService } from '@/services/academics.service'

const getId = (val) => (typeof val === 'object' && val !== null ? val._id : val || '')

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MyAdmitCardPage() {
  const { user, role } = useAuth()
  const { toast } = useToast()
  const studentId = user?.id
  const [printingId, setPrintingId] = useState(null)
  const [selectedExamGroup, setSelectedExamGroup] = useState('')

  // Fetch exam schedules
  const { data: examSchedulesData, isLoading, refetch } = useAsyncData(
    () => examinationService.getExamSchedules(),
    []
  )

  // Fetch exam groups for filter
  const { data: examGroupsData } = useAsyncData(
    () => examinationService.getExamGroups(),
    []
  )

  // Fetch classes for mapping
  const { data: classesData } = useAsyncData(
    () => academicsService.classes(),
    []
  )

  // Fetch subjects for mapping
  const { data: subjectsData } = useAsyncData(
    () => academicsService.subjects(),
    []
  )

  // Fetch admit card template
  const { data: templateData } = useAsyncData(
    () => examinationService.getAdmitCardDesigns(),
    []
  )

  // Fetch student profile for full details
  const { data: studentProfile } = useAsyncData(
    () => studentId ? studentPortalService.getMyProfile(studentId) : Promise.resolve(null),
    [studentId]
  )

  // Create maps for ID to name conversion
  const groupMap = useMemo(() => {
    const groups = Array.isArray(examGroupsData?.data) ? examGroupsData.data : Array.isArray(examGroupsData) ? examGroupsData : []
    return Object.fromEntries(groups.map((x) => [x._id, x.exam_name || x.name]))
  }, [examGroupsData])

  const classMap = useMemo(() => {
    const classes = Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : []
    return Object.fromEntries(classes.map((x) => [x._id, x.class_name || x.name]))
  }, [classesData])

  const subjectMap = useMemo(() => {
    const subjects = Array.isArray(subjectsData?.data) ? subjectsData.data : Array.isArray(subjectsData) ? subjectsData : []
    return Object.fromEntries(subjects.map((x) => [x._id, x.subject_name || x.name]))
  }, [subjectsData])

  const template = useMemo(() => {
    const tmpl = templateData?.data?.[0] || {}
    return tmpl
  }, [templateData])

  const examSchedules = useMemo(() => {
    const schedules = Array.isArray(examSchedulesData?.data) ? examSchedulesData.data : Array.isArray(examSchedulesData) ? examSchedulesData : []
    return schedules
  }, [examSchedulesData])

  // Filter exam schedules for student's class
  const studentExamSchedules = useMemo(() => {
    if (!studentProfile) return []
    const studentClass = studentProfile.class_name || studentProfile.class
    if (!studentClass) return []
    
    return examSchedules.filter(schedule => {
      const classId = getId(schedule.class_id)
      const className = classMap[classId] || ''
      // Match class (e.g., "12" matches "Class 12" or "12")
      return className.includes(studentClass) || studentClass.includes(className)
    })
  }, [examSchedules, studentProfile, classMap])

  // Group exam schedules by exam group
  const examGroupSchedules = useMemo(() => {
    const grouped = {}
    studentExamSchedules.forEach(schedule => {
      const examGroupId = getId(schedule.exam_group_id)
      if (!grouped[examGroupId]) {
        grouped[examGroupId] = []
      }
      grouped[examGroupId].push(schedule)
    })
    return grouped
  }, [studentExamSchedules])

  // Filter by selected exam group
  const filteredExamGroups = useMemo(() => {
    if (!selectedExamGroup) {
      return Object.entries(examGroupSchedules).map(([examGroupId, schedules]) => ({
        examGroupId,
        examGroupName: groupMap[examGroupId] || 'Unknown',
        schedules,
      }))
    }
    if (examGroupSchedules[selectedExamGroup]) {
      return [{
        examGroupId: selectedExamGroup,
        examGroupName: groupMap[selectedExamGroup] || 'Unknown',
        schedules: examGroupSchedules[selectedExamGroup],
      }]
    }
    return []
  }, [examGroupSchedules, selectedExamGroup, groupMap])

  const stats = useMemo(() => ({
    total: Object.keys(examGroupSchedules).length,
    upcoming: studentExamSchedules.length,
  }), [examGroupSchedules, studentExamSchedules])

  const generateAdmitCardHTML = (studentData, template, examSchedules, examGroupName) => {
    const studentName = `${studentData.name?.first || ''} ${studentData.name?.last || ''}`.trim()
    const fatherName = studentData.father_name || null
    
    // Use template data
    const schoolName = template?.header || 'SCHOOL NAME'
    const schoolLogo = template?.school_logo || ''
    
    // Use first exam schedule for basic info
    const firstSchedule = examSchedules[0] || {}
    const classId = getId(firstSchedule.class_id)
    const className = classMap[classId] || studentData.class_name || 'N/A'
    
    // Reporting time fixed to "30 min before exam"
    const reportingTime = '30 min before exam'

    // Generate exam schedule table rows
    const examScheduleRows = examSchedules.map(schedule => {
      const subjectId = getId(schedule.subject_id)
      const subject = subjectMap[subjectId] || schedule.subject_name || schedule.subject?.subject_name || 'N/A'
      const examDate = formatDate(schedule.date)
      const startTime = schedule.start_time || 'N/A'
      const endTime = schedule.end_time || 'N/A'
      const room = schedule.room || 'N/A'
      
      return `
        <tr>
          <td>${examGroupName}</td>
          <td>${subject}</td>
          <td>${examDate}</td>
          <td>${startTime}</td>
          <td>${endTime}</td>
          <td>${room}</td>
        </tr>
      `
    }).join('')

    return `
      <html>
        <head>
          <title>Admit Card - ${studentName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 0; 
              margin: 0; 
              background-color: #f5f5f5;
              min-height: 100vh;
            }
            .container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .admit-card { 
              background-color: white;
              padding: 40px;
              max-width: 700px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin-bottom: 20px; 
            }
            .logo-section { display: flex; align-items: center; gap: 20px; }
            .logo-placeholder {
              width: 80px;
              height: 80px;
              border: 2px solid #333;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: #666;
            }
            .logo-placeholder img {
              width: 100%;
              height: 100%;
              border-radius: 50%;
              object-fit: cover;
            }
            .school-info h1 { margin: 0 0 5px; font-size: 22px; font-weight: bold; text-transform: uppercase; }
            .school-info h2 { margin: 0; font-size: 18px; font-weight: bold; color: #555; }
            
            .photo-box { 
              width: 100px; 
              height: 120px; 
              border: 2px solid #333; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 10px; 
              text-align: center; 
              color: #666;
              background-color: #f9f9f9;
            }
            
            .title { 
              text-align: center; 
              margin: 20px 0; 
              font-size: 20px; 
              font-weight: bold; 
              text-decoration: underline; 
            }
            
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .info-table td {
              padding: 8px 12px;
              border: 1px solid #ddd;
            }
            .info-table td:first-child {
              font-weight: bold;
              background-color: #f5f5f5;
              width: 30%;
            }
            
            .exam-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .exam-table th, .exam-table td {
              padding: 10px;
              border: 1px solid #333;
              text-align: left;
            }
            .exam-table th {
              background-color: white;
              color: black;
              font-weight: bold;
            }
            
            .instructions { 
              text-align: left; 
              margin: 20px 0; 
              padding: 15px; 
              border: 1px solid #ddd;
              background-color: #f9f9f9;
            }
            .instructions h4 { 
              margin: 0 0 10px; 
              font-weight: bold; 
              color: #333;
            }
            .instructions ol { 
              margin: 0; 
              padding-left: 20px; 
              color: #333;
            }
            .instructions li { 
              margin: 8px 0; 
              line-height: 1.4;
            }
            
            .signature { 
              text-align: right; 
              margin-top: 40px; 
              padding-right: 20px;
            }
            .signature-line { 
              border-top: 1px solid #333; 
              width: 180px; 
              margin-top: 40px;
            }
            .signature p {
              margin-top: 5px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="admit-card">
              <div class="header">
                <div class="logo-section">
                  ${schoolLogo ? 
                    `<div class="logo-placeholder"><img src="${schoolLogo}" alt="School Logo" /></div>` : 
                    `<div class="logo-placeholder">LOGO</div>`
                  }
                  <div class="school-info">
                    <h1>${schoolName}</h1>
                    <h2>${examGroupName}</h2>
                  </div>
                </div>
                <div class="photo-box">
                  CANDIDATE<br>PHOTO
                </div>
              </div>
              
              <div class="title">ADMIT CARD</div>
              
              <table class="info-table">
                <tr>
                  <td>Roll No</td>
                  <td>${studentData.roll_number || '---'}</td>
                </tr>
                <tr>
                  <td>Student Name</td>
                  <td>${studentName}</td>
                </tr>
                ${fatherName ? `
                <tr>
                  <td>Father Name</td>
                  <td>${fatherName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td>Class</td>
                  <td>${className}</td>
                </tr>
                <tr>
                  <td>Reporting Time</td>
                  <td>${reportingTime}</td>
                </tr>
              </table>
              
              <table class="exam-table">
                <thead>
                  <tr>
                    <th>Exam Group</th>
                    <th>Subject</th>
                    <th>Exam Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  ${examScheduleRows}
                </tbody>
              </table>
              
              <div class="instructions">
                <h4>Important Instructions for Candidate:</h4>
                <ol>
                  <li>Please bring this Admit Card to the Examination Hall on all exam days.</li>
                  <li>Report to the examination hall at least 30 minutes before commencement of the exam.</li>
                </ol>
              </div>
              
              <div class="signature">
                <div class="signature-line"></div>
                <p>Principal Signature</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const handlePrint = useCallback((examGroupData) => {
    const student = studentProfile || user
    const html = generateAdmitCardHTML(student, template, examGroupData.schedules, examGroupData.examGroupName)
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({ title: 'Popup Blocked', description: 'Please allow popups in your browser', variant: 'destructive' })
      return
    }
    
    printWindow.document.write(html)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      toast({ title: 'Success', description: 'Admit card opened for printing' })
    }, 250)
  }, [studentProfile, user, template, toast])

  const columns = useMemo(() => [
    {
      accessorKey: "examGroupName",
      header: "Exam Group",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.examGroupName}</span>
      ),
    },
    {
      accessorKey: "schedules",
      header: "Subjects",
      cell: ({ row }) => {
        const subjects = row.original.schedules.map(s => {
          const subjectId = getId(s.subject_id)
          return subjectMap[subjectId] || s.subject_name || s.subject?.subject_name || 'N/A'
        }).join(', ')
        return subjects
      },
    },
    {
      accessorKey: "schedules",
      header: "Exam Dates",
      cell: ({ row }) => {
        const dates = row.original.schedules.map(s => formatDate(s.date)).join(', ')
        return dates
      },
    },
    {
      accessorKey: "schedules",
      header: "Total Exams",
      cell: ({ row }) => row.original.schedules.length,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const examGroupId = row.original.examGroupId
        const isPrinting = printingId === examGroupId
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePrint(row.original)}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            {isPrinting ? 'Printing...' : 'Print'}
          </Button>
        )
      },
    },
  ], [printingId, handlePrint])

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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Examinations' }, { label: 'My Admit Card' }]} />
      <PageHeader
        title="My Admit Card"
        description="View and print your examination admit cards."
        icon={FileText}
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={refetch}
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Exam Groups" value={stats.total} icon={FileText} accent="primary" />
        <StatCard label="Upcoming Exams" value={stats.upcoming} icon={CheckCircle2} accent="success" />
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <span className="text-xs font-medium">Exam Group</span>
          <select
            value={selectedExamGroup}
            onChange={(e) => setSelectedExamGroup(e.target.value)}
            className="w-full h-9 mt-1 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Exam Groups</option>
            {(examGroupsData || []).map(eg => (
              <option key={eg._id} value={eg._id}>
                {eg.exam_name || eg.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={5} />
      ) : studentExamSchedules.length === 0 ? (
        <NoData
          icon={FileText}
          title="No Admit Cards Available"
          description="Your exam schedules will appear here once published."
        />
      ) : filteredExamGroups.length === 0 ? (
        <NoData
          icon={FileText}
          title="No Results Found"
          description="Try selecting a different exam group."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredExamGroups}
        />
      )}
    </div>
  )
}
