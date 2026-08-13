// ====================================================================
// Module: Examinations
// Page: Print Admit Card
//
// Purpose: Search students and print admit cards for examinations.
// Data Source: studentService.list(), examSchedule
// ====================================================================

import { useMemo, useState, useCallback } from 'react'
import { Printer, RefreshCw, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'
import studentService from '@/services/student.service'
import { examinationService } from '@/services/examination.service'
import { academicsService } from '@/services/academics.service'

const getId = (val) => (typeof val === 'object' && val !== null ? val._id : val || '')

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PrintAdmitCardPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [printingId, setPrintingId] = useState(null)
  const [selectedExamGroup, setSelectedExamGroup] = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  const { data, isLoading, refetch } = useAsyncData(
    () => studentService.list(),
    []
  )

  // Fetch exam groups for selection
  const { data: examGroupsData } = useAsyncData(
    () => examinationService.getExamGroups(),
    []
  )

  // Fetch classes for selection
  const { data: classesData } = useAsyncData(
    () => academicsService.classes(),
    []
  )

  // Fetch exam schedules (same as ExamSchedulePage)
  const { data: examSchedulesData } = useAsyncData(
    () => examinationService.getExamSchedules(),
    []
  )

  // Fetch admit card template (school name)
  const { data: templateData } = useAsyncData(
    () => examinationService.getAdmitCardDesigns(),
    []
  )

  // Create maps for ID to name conversion (same as ExamSchedulePage)
  const groupMap = useMemo(() => {
    const groups = Array.isArray(examGroupsData?.data) ? examGroupsData.data : Array.isArray(examGroupsData) ? examGroupsData : []
    return Object.fromEntries(groups.map((x) => [x._id, x.exam_name || x.name]))
  }, [examGroupsData])
  
  const classMap = useMemo(() => {
    const classes = Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : []
    return Object.fromEntries(classes.map((x) => [x._id, x.class_name || x.name]))
  }, [classesData])

  const rawRows = useMemo(() => {
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    return rows
  }, [data])

  const examSchedules = useMemo(() => {
    const schedules = Array.isArray(examSchedulesData?.data) ? examSchedulesData.data : Array.isArray(examSchedulesData) ? examSchedulesData : []
    return schedules
  }, [examSchedulesData])

  const template = useMemo(() => {
    const tmpl = templateData?.data?.[0] || {}
    return tmpl
  }, [templateData])

  // Filter exam schedules based on selection (match by IDs like ExamSchedulePage)
  const filteredExamSchedules = useMemo(() => {
    let schedules = examSchedules
    
    if (selectedExamGroup) {
      schedules = schedules.filter(s => {
        const examGroupId = getId(s.exam_group_id)
        return examGroupId === selectedExamGroup
      })
    }
    
    if (selectedClass) {
      schedules = schedules.filter(s => {
        const classId = getId(s.class_id)
        return classId === selectedClass
      })
    }
    
    return schedules
  }, [examSchedules, selectedExamGroup, selectedClass])

  const filteredRows = useMemo(() => {
    let result = rawRows

    // IMPORTANT: Only show students if both exam group and class are selected AND exam schedule exists
    if (!selectedExamGroup || !selectedClass) {
      return []
    }

    if (filteredExamSchedules.length === 0) {
      return []
    }

    // Filter by class if selected
    if (selectedClass) {
      const className = classMap[selectedClass] || selectedClass
      // Match if class_name contains the selected class name (e.g., "Class 4" matches "4")
      result = result.filter(r => {
        const studentClass = r.class_name || ''
        return studentClass.includes(className) || className.includes(studentClass)
      })
    }

    // Filter by search
    if (!search.trim()) {
      return result
    }

    const q = search.toLowerCase()
    result = result.filter((r) =>
      [
        r.name?.first,
        r.name?.last,
        r.roll_number,
        r.class_name,
        r.section,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
    return result
  }, [rawRows, search, selectedClass, classMap, selectedExamGroup, filteredExamSchedules])

  const stats = useMemo(() => ({
    total: rawRows.length,
    ready: rawRows.filter(r => r.status === "active").length,
  }), [rawRows])

  const generateAdmitCardHTML = (studentData, template, examSchedules) => {
    const studentName = `${studentData.name?.first || ''} ${studentData.name?.last || ''}`.trim()
    const fatherName = studentData.father_name || null
    
    // Use template data (school name)
    const schoolName = template?.header || 'SCHOOL NAME'
    const schoolLogo = template?.school_logo || ''
    
    // Use first exam schedule for basic info
    const firstSchedule = examSchedules[0] || {}
    const examGroupId = getId(firstSchedule.exam_group_id)
    const classId = getId(firstSchedule.class_id)
    
    const examGroup = groupMap[examGroupId] || 'N/A'
    const className = classMap[classId] || 'N/A'
    
    // Reporting time fixed to "30 min before exam"
    const reportingTime = '30 min before exam'

    // Generate exam schedule table rows
    const examScheduleRows = examSchedules.map(schedule => {
      const subject = schedule.subject_name || schedule.subject?.subject_name || 'N/A'
      const examDate = formatDate(schedule.date)
      const startTime = schedule.start_time || 'N/A'
      const endTime = schedule.end_time || 'N/A'
      const room = schedule.room || 'N/A'
      
      return `
        <tr>
          <td>${examGroup}</td>
          <td>${subject}</td>
          <td>${className}</td>
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
                    <h2>${examGroup}</h2>
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
                    <th>Class</th>
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

  const handlePrint = useCallback((student) => {
    if (filteredExamSchedules.length === 0) {
      toast({ 
        title: 'No Exam Schedule Found', 
        description: 'Please select the correct Exam Group and Class that has an exam schedule.',
        variant: 'destructive' 
      })
      return
    }
    
    // Generate admit card with ALL exam schedules (not just first one)
    const html = generateAdmitCardHTML(student, template, filteredExamSchedules)
    
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
  }, [filteredExamSchedules, template, toast])

  const columns = useMemo(() => [
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {row.original.name?.first} {row.original.name?.last}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.email}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "roll_number",
      header: "Roll No",
    },
    {
      accessorKey: "class_name",
      header: "Class",
    },
    {
      accessorKey: "section",
      header: "Section",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "active"
              ? "default"
              : "secondary"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const studentId = row.original._id || row.original.id || row.original.student_id
        const isPrinting = printingId === studentId
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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Examinations', to: '/examinations/exam-groups' },
          { label: 'Print Admit Card' },
        ]}
      />

      <PageHeader
        title="Print Admit Card"
        description="Search students and print admit cards for examinations."
        icon={Printer}
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
        <StatCard label="Total Students" value={stats.total} icon={FileText} accent="primary" />
        <StatCard label="Active Students" value={stats.ready} icon={CheckCircle2} accent="success" />
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <span className="text-xs font-medium">Exam Group</span>
          <select
            value={selectedExamGroup}
            onChange={(e) => setSelectedExamGroup(e.target.value)}
            className="w-full h-9 mt-1 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select Exam Group</option>
            {(examGroupsData || []).map(eg => (
              <option key={eg._id} value={eg._id}>
                {eg.exam_name || eg.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <span className="text-xs font-medium">Class</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full h-9 mt-1 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select Class</option>
            {(classesData || []).map(cls => (
              <option key={cls._id} value={cls._id}>
                {cls.class_name || cls.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <span className="text-xs font-medium">Search</span>
          <SearchBar
            value={search}
            onChange={setSearch}
            disabled={rawRows.length === 0}
            placeholder="Search student..."
            className="w-full mt-1"
          />
        </div>
      </div>

      {selectedExamGroup && selectedClass && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
          filteredExamSchedules.length > 0 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <span className={`text-sm ${
            filteredExamSchedules.length > 0 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-yellow-700 dark:text-yellow-300'
          }`}>
            {filteredExamSchedules.length > 0 
              ? `✓ ${filteredExamSchedules.length} exam schedule(s) found for this selection` 
              : '⚠ No exam schedule found for this Exam Group and Class combination. Please check the Exam Schedule page.'}
          </span>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      ) : !selectedExamGroup || !selectedClass ? (
        <NoData
          icon={Printer}
          title="Select Exam Group and Class"
          description="Please select both an Exam Group and Class to view students for admit card printing."
        />
      ) : filteredExamSchedules.length === 0 ? (
        <NoData
          icon={Printer}
          title="No Exam Schedule Found"
          description="No exam schedule exists for the selected Exam Group and Class. Please create an exam schedule first."
        />
      ) : filteredRows.length === 0 ? (
        <NoData
          icon={Printer}
          title="No Students Found"
          description="No students are available for admit card printing for this class."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredRows}
        />
      )}
    </div>
  )
}
