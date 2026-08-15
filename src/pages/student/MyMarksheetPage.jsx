import { useMemo, useState, useCallback } from 'react'
import { Printer, RefreshCw, FileText, CheckCircle2, Download } from 'lucide-react'
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

const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 40) return 'D'
  if (percentage >= 33) return 'E'
  return 'F'
}

export default function MyMarksheetPage() {
  const { user, role } = useAuth()
  const { toast } = useToast()
  const studentId = user?.id
  const [printingId, setPrintingId] = useState(null)
  const [selectedExamGroup, setSelectedExamGroup] = useState('')

  // Fetch exam results
  const { data: examResultsData, isLoading, refetch } = useAsyncData(
    () => examinationService.getExamResults(),
    []
  )

  // Fetch exam groups for filter
  const { data: examGroupsData } = useAsyncData(
    () => examinationService.getExamGroups(),
    []
  )

  // Fetch subjects for display
  const { data: subjectsData } = useAsyncData(
    () => academicsService.subjects(),
    []
  )

  // Fetch marksheet design template
  const { data: templateData } = useAsyncData(
    () => examinationService.getMarksheetDesigns({ _t: Date.now() }),
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

  const subjectMap = useMemo(() => {
    const subjects = Array.isArray(subjectsData?.data) ? subjectsData.data : Array.isArray(subjectsData) ? subjectsData : []
    return Object.fromEntries(subjects.map((x) => [x._id, x.subject_name || x.name]))
  }, [subjectsData])

  const template = useMemo(() => {
    const tmpl = templateData?.data?.[0] || {}
    return tmpl
  }, [templateData])

  const rawRows = useMemo(() => {
    const rows = Array.isArray(examResultsData?.data) ? examResultsData.data : Array.isArray(examResultsData) ? examResultsData : []
    return rows
  }, [examResultsData])

  // Filter results for this student only
  const studentRows = useMemo(() => {
    if (!studentId) return []
    return rawRows.filter(r => {
      const rowStudentId = getId(r.student_id)
      return rowStudentId === studentId
    })
  }, [rawRows, studentId])

  // Filter by exam group
  const filteredRows = useMemo(() => {
    let result = studentRows
    if (selectedExamGroup) {
      result = result.filter(r => {
        const examGroupId = getId(r.exam_group_id)
        return examGroupId === selectedExamGroup
      })
    }
    return result
  }, [studentRows, selectedExamGroup])

  // Aggregate results by exam group
  const aggregatedRows = useMemo(() => {
    const examGroupResults = {}
    
    filteredRows.forEach(result => {
      const examGroupId = getId(result.exam_group_id)
      if (!examGroupResults[examGroupId]) {
        examGroupResults[examGroupId] = {
          exam_group_id: examGroupId,
          subjects: [],
          totalObtained: 0,
          totalMax: 0,
        }
      }
      examGroupResults[examGroupId].subjects.push(result)
      examGroupResults[examGroupId].totalObtained += result.marks_obtained || result.obtained_marks || result.marks || 0
      examGroupResults[examGroupId].totalMax += result.total_marks || result.max_marks || 100
    })
    
    return Object.values(examGroupResults).map(examGroupResult => {
      const percentage = examGroupResult.totalMax > 0 ? ((examGroupResult.totalObtained / examGroupResult.totalMax) * 100).toFixed(2) : '0.00'
      const percentageNum = parseFloat(percentage)
      
      return {
        ...examGroupResult,
        student: studentProfile || user,
        percentage,
        percentageNum,
        grade: calculateGrade(percentageNum),
        passed: percentageNum >= 33,
      }
    })
  }, [filteredRows, user, studentProfile])

  const stats = useMemo(() => ({
    total: aggregatedRows.length,
    passed: aggregatedRows.filter(r => r.passed).length,
  }), [aggregatedRows])

  const generateMarksheetHTML = (aggregatedData, template) => {
    const student = aggregatedData.student || {}
    const studentName = `${student.name?.first || ''} ${student.name?.last || ''}`.trim() || 'N/A'
    const totalObtained = aggregatedData.totalObtained || 0
    const totalMax = aggregatedData.totalMax || 100
    const percentage = aggregatedData.percentage || '0.00'
    const percentageNum = aggregatedData.percentageNum || 0
    const grade = aggregatedData.grade || 'N/A'
    const passed = percentageNum >= 33

    // Use template data
    const schoolName = template?.header || 'SCHOOL NAME'
    const schoolLogo = template?.school_logo || ''
    const footer = template?.footer || 'Principal Signature'

    // Get names from maps with fallbacks
    const examGroupId = getId(aggregatedData.exam_group_id)
    const examGroup = groupMap[examGroupId] || 'N/A'
    const className = student?.class_name || student?.class || 'N/A'

    // Generate subject table rows
    const subjectRows = (aggregatedData.subjects || []).map(subject => {
      const subjectId = getId(subject.subject_id)
      const subjectName = subjectMap[subjectId] || subject.subject_name || subject.subject || 'N/A'
      const obtained = subject.marks_obtained || subject.obtained_marks || subject.marks || 0
      const max = subject.total_marks || subject.max_marks || 100
      const subPercentage = max > 0 ? ((obtained / max) * 100).toFixed(2) : '0.00'
      const subGrade = calculateGrade(parseFloat(subPercentage))
      
      return `
        <tr>
          <td>${subjectName}</td>
          <td>${max}</td>
          <td>${obtained}</td>
          <td>${subGrade}</td>
          <td>${subject.remarks || ''}</td>
        </tr>
      `
    }).join('')

    return `
      <html>
        <head>
          <title>Marksheet - ${studentName}</title>
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
            .marksheet { 
              background-color: white;
              padding: 40px;
              max-width: 700px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .logo-placeholder {
              width: 80px;
              height: 80px;
              border: 2px solid #333;
              border-radius: 50%;
              margin: 0 auto 15px;
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
            .header h1 { margin: 10px 0; font-size: 22px; font-weight: bold; text-transform: uppercase; }
            .header h2 { margin: 5px 0; font-size: 18px; font-weight: bold; color: #555; }
            .header p { margin: 5px 0; font-size: 12px; color: #666; }
            
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
            
            .subject-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .subject-table th, .subject-table td {
              padding: 10px;
              border: 1px solid #333;
              text-align: left;
            }
            .subject-table th {
              background-color: white;
              color: black;
              font-weight: bold;
            }
            
            .result-summary {
              border: 1px solid #333;
              background-color: #f9f9f9;
              padding: 15px;
              margin: 20px 0;
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              gap: 20px;
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
            <div class="marksheet">
              <div class="header">
                ${schoolLogo ? 
                  `<div class="logo-placeholder"><img src="${schoolLogo}" alt="School Logo" /></div>` : 
                  `<div class="logo-placeholder">LOGO</div>`
                }
                <h1>${schoolName}</h1>
                <h2>${examGroup}</h2>
                <p>Affiliated to CBSE, New Delhi</p>
              </div>
              
              <table class="info-table">
                <tr>
                  <td>Student Name</td>
                  <td>${studentName}</td>
                </tr>
                <tr>
                  <td>Roll No</td>
                  <td>${student.roll_number || '---'}</td>
                </tr>
                <tr>
                  <td>Class</td>
                  <td>${className}</td>
                </tr>
                <tr>
                  <td>Session</td>
                  <td>2026-27</td>
                </tr>
              </table>
              
              <table class="subject-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Max Marks</th>
                    <th>Obtained</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${subjectRows}
                </tbody>
              </table>
              
              <div class="result-summary">
                <span>Total Marks : ${totalObtained} / ${totalMax}</span>
                <span>Percentage : ${percentage}%</span>
                <span>Overall Grade : ${grade}</span>
                <span style="color: ${passed ? '#16a34a' : '#dc2626'};">Result : ${passed ? 'PASS' : 'FAIL'}</span>
              </div>
              
              <div class="signature">
                <div class="signature-line"></div>
                <p>${footer}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const handlePrint = useCallback((result) => {
    const html = generateMarksheetHTML(result, template)
    
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
      toast({ title: 'Success', description: 'Marksheet opened for printing' })
    }, 250)
  }, [template, toast])

  const columns = useMemo(() => [
    {
      accessorKey: "exam_group",
      header: "Exam Group",
      cell: ({ row }) => {
        const examGroupId = getId(row.original.exam_group_id)
        return groupMap[examGroupId] || 'N/A'
      },
    },
    {
      accessorKey: "subjects",
      header: "Subjects",
      cell: ({ row }) => {
        const subjects = row.original.subjects || []
        const subjectNames = subjects.map(s => {
          const subjectId = getId(s.subject_id)
          return subjectMap[subjectId] || s.subject_name || s.subject || 'N/A'
        }).join(', ')
        return subjectNames || 'N/A'
      },
    },
    {
      accessorKey: "marks",
      header: "Marks",
      cell: ({ row }) => (
        <span>
          {row.original.totalObtained} / {row.original.totalMax}
        </span>
      ),
    },
    {
      accessorKey: "percentage",
      header: "Percentage",
      cell: ({ row }) => `${row.original.percentage}%`,
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.grade}</span>
      ),
    },
    {
      accessorKey: "passed",
      header: "Result",
      cell: ({ row }) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${row.original.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {row.original.passed ? 'PASS' : 'FAIL'}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const examGroupId = row.original.exam_group_id
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
  ], [printingId, handlePrint, groupMap, subjectMap])

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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Examinations' }, { label: 'My Marksheet' }]} />
      <PageHeader
        title="My Marksheet"
        description="View and print your examination marksheets."
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
        <StatCard label="Total Marksheets" value={stats.total} icon={FileText} accent="primary" />
        <StatCard label="Passed" value={stats.passed} icon={CheckCircle2} accent="success" />
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
        <LoadingSkeleton variant="table" rows={6} cols={7} />
      ) : studentRows.length === 0 ? (
        <NoData
          icon={FileText}
          title="No Marksheets Available"
          description="Your exam results will appear here once published."
        />
      ) : aggregatedRows.length === 0 ? (
        <NoData
          icon={FileText}
          title="No Results Found"
          description="Try selecting a different exam group."
        />
      ) : (
        <DataTable
          columns={columns}
          data={aggregatedRows}
        />
      )}
    </div>
  )
}
