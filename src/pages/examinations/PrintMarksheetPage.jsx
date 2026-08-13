// ====================================================================
// Module: Examinations
// Page: Print Marksheet
//
// Purpose: Search exam results and print marksheets using backend data.
// Data Source: examinationService.getExamResults()
// ====================================================================

import { useMemo, useState, useCallback } from 'react'
import { Printer, RefreshCw, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'
import { examinationService } from '@/services/examination.service'
import { academicsService } from '@/services/academics.service'
import studentService from '@/services/student.service'

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

export default function PrintMarksheetPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [printingId, setPrintingId] = useState(null)
  const [selectedExamGroup, setSelectedExamGroup] = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  // Fetch exam results (marks)
  const { data: examResultsData, isLoading, refetch } = useAsyncData(
    () => examinationService.getExamResults(),
    []
  )

  // Fetch all students to get names and class info
  const { data: studentsData } = useAsyncData(
    () => studentService.list(),
    []
  )

  // Fetch exam groups for filter
  const { data: examGroupsData } = useAsyncData(
    () => examinationService.getExamGroups(),
    []
  )

  // Fetch classes for filter
  const { data: classesData } = useAsyncData(
    () => academicsService.classes(),
    []
  )

  // Fetch subjects for display (not filter)
  const { data: subjectsData } = useAsyncData(
    () => academicsService.subjects(),
    []
  )

  // Fetch marksheet design template (with cache busting)
  const { data: templateData } = useAsyncData(
    () => examinationService.getMarksheetDesigns({ _t: Date.now() }),
    []
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

  // Create student map from student_id to student data
  const studentMap = useMemo(() => {
    const students = Array.isArray(studentsData?.data) ? studentsData.data : Array.isArray(studentsData) ? studentsData : []
    return Object.fromEntries(students.map((x) => [x._id, x]))
  }, [studentsData])

  const rawRows = useMemo(() => {
    const rows = Array.isArray(examResultsData?.data) ? examResultsData.data : Array.isArray(examResultsData) ? examResultsData : []
    return rows
  }, [examResultsData])

  const template = useMemo(() => {
    const tmpl = templateData?.data?.[0] || {}
    return tmpl
  }, [templateData])

  // Filter exam results based on selection (not search - search is applied to aggregated rows)
  const filteredRows = useMemo(() => {
    let result = rawRows

    // Filter by exam group
    if (selectedExamGroup) {
      result = result.filter(r => {
        const examGroupId = getId(r.exam_group_id)
        return examGroupId === selectedExamGroup
      })
    }

    // Filter by class (need to look up student's class)
    if (selectedClass) {
      result = result.filter(r => {
        const studentId = getId(r.student_id)
        const student = studentMap[studentId]
        if (!student) return false
        const studentClassId = student.class_id?._id || student.class_id
        return studentClassId === selectedClass
      })
    }

    return result
  }, [rawRows, selectedExamGroup, selectedClass, studentMap])

  // Aggregate results by student (group all subjects for each student)
  const aggregatedRows = useMemo(() => {
    const studentResults = {}
    
    filteredRows.forEach(result => {
      const studentId = getId(result.student_id)
      if (!studentResults[studentId]) {
        studentResults[studentId] = {
          student_id: studentId,
          exam_group_id: result.exam_group_id,
          subjects: [],
          totalObtained: 0,
          totalMax: 0,
        }
      }
      studentResults[studentId].subjects.push(result)
      studentResults[studentId].totalObtained += result.marks_obtained || result.obtained_marks || result.marks || 0
      studentResults[studentId].totalMax += result.total_marks || result.max_marks || 100
    })
    
    return Object.values(studentResults).map(studentResult => {
      const studentId = getId(studentResult.student_id)
      const student = studentMap[studentId] || {}
      const percentage = studentResult.totalMax > 0 ? ((studentResult.totalObtained / studentResult.totalMax) * 100).toFixed(2) : '0.00'
      const percentageNum = parseFloat(percentage)
      
      return {
        ...studentResult,
        student,
        percentage,
        percentageNum,
        grade: calculateGrade(percentageNum),
        passed: percentageNum >= 33,
      }
    })
  }, [filteredRows, studentMap])

  // Apply search filter to aggregated rows
  const displayedRows = useMemo(() => {
    if (!search.trim()) {
      return aggregatedRows
    }

    const q = search.toLowerCase()
    return aggregatedRows.filter(row => {
      const student = row.student
      const studentName = student ? `${student.name?.first || ''} ${student.name?.last || ''}`.trim() : ''
      const searchFields = [
        studentName,
        student?.roll_number,
        student?.class_name,
      ].filter(Boolean)
      return searchFields.some((v) => String(v).toLowerCase().includes(q))
    })
  }, [aggregatedRows, search])

  const stats = useMemo(() => ({
    total: aggregatedRows.length,
    ready: aggregatedRows.length,
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
  }, [template, toast, studentMap])

  const columns = useMemo(() => [
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original.student
        const name = student ? `${student.name?.first || ''} ${student.name?.last || ''}`.trim() : 'N/A'
        return (
          <div>
            <p className="font-medium">{name}</p>
          </div>
        )
      },
    },
    {
      accessorKey: "class_section",
      header: "Class/Section",
      cell: ({ row }) => {
        const student = row.original.student
        const className = student?.class_name || student?.class || 'N/A'
        return className
      },
    },
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
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const studentId = row.original.student_id
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
  ], [printingId, handlePrint, groupMap, subjectMap])

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Examinations', to: '/examinations/exam-groups' },
          { label: 'Print Marksheet' },
        ]}
      />

      <PageHeader
        title="Print Marksheet"
        description="Search exam results and print marksheets for students."
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
        <StatCard label="Total Results" value={stats.total} icon={FileText} accent="primary" />
        <StatCard label="Ready to Print" value={stats.ready} icon={CheckCircle2} accent="success" />
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
        <div className="flex-1">
          <span className="text-xs font-medium">Class</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full h-9 mt-1 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Classes</option>
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
            disabled={aggregatedRows.length === 0}
            placeholder="Search student..."
            className="w-full mt-1"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      ) : rawRows.length === 0 ? (
        <NoData
          icon={Printer}
          title="No Exam Results Found"
          description="No exam results are available for marksheet printing."
        />
      ) : aggregatedRows.length === 0 ? (
        <NoData
          icon={Printer}
          title="No Results Match Filters"
          description="Try adjusting your filters or search criteria."
        />
      ) : (
        <DataTable
          columns={columns}
          data={displayedRows}
        />
      )}
    </div>
  )
}
