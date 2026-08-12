// ====================================================================
// Module: Examinations
// Page: Print Marksheet
//
// Purpose: Search students and print marksheets for examinations.
// Data Source: studentService.list()
// Print Service: examinationService.printMarksheet()
// ====================================================================

import { useMemo, useState } from 'react'
import { Printer, RefreshCw, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { ExportButtons } from '@/components/ExportButtons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'
import studentService from '@/services/student.service'
import { examinationService } from '@/services/examination.service'

export default function PrintMarksheetPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [printingId, setPrintingId] = useState(null)

  const { data, isLoading, refetch } = useAsyncData(
    () => studentService.list(),
    []
  )

  const rawRows = useMemo(() => {
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data)) return data
    return []
  }, [data])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rawRows

    const q = search.toLowerCase()

    return rawRows.filter((r) =>
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
  }, [rawRows, search])

  const stats = useMemo(() => ({
    total: rawRows.length,
    active: rawRows.filter(r => r.status === "active").length,
  }), [rawRows])

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
            size="icon"
            variant="ghost"
            onClick={() => handlePrint(row.original)}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
          </Button>
        )
      },
    },
  ], [])

  const columnsForExport = useMemo(() => [
    {
      key: "student",
      label: "Student",
    },
    {
      key: "roll_number",
      label: "Roll No",
    },
    {
      key: "class_name",
      label: "Class",
    },
    {
      key: "section",
      label: "Section",
    },
    {
      key: "status",
      label: "Status",
    },
  ], [])

  const exportRows = useMemo(() => {
    return filteredRows.map((r) => ({
      student: `${r.name?.first ?? ""} ${r.name?.last ?? ""}`,
      roll_number: r.roll_number,
      class_name: r.class_name,
      section: r.section,
      status: r.status,
    }))
  }, [filteredRows])

  const getStudentId = (student) => student._id || student.id || student.student_id

  const getBlobFromResponse = (response) => {
    if (response instanceof Blob) return response
    if (response.data instanceof Blob) return response.data
    if (response.response instanceof Blob) return response.response
    return null
  }

  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A'

  const generateMarksheetHTML = (studentData) => {
    const studentName = `${studentData.name?.first || ''} ${studentData.name?.last || ''}`.trim()
    const guardian = studentData.guardian || {}

    return `
      <html>
        <head>
          <title>Marksheet - ${studentName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .marksheet { border: 2px solid #333; padding: 20px; text-align: center; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #333; }
            .student-info { text-align: left; margin: 20px 0; }
            .student-info table { width: 100%; border-collapse: collapse; }
            .student-info td { padding: 8px; border-bottom: 1px solid #ddd; }
            .student-info td:first-child { font-weight: bold; width: 40%; }
            .guardian-info { text-align: left; margin: 20px 0; border-top: 2px solid #333; padding-top: 10px; }
            .guardian-info h3 { margin-top: 0; }
            .footer { margin-top: 30px; border-top: 2px solid #333; padding-top: 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="marksheet">
            <div class="header">
              <h1>EXAMINATION MARKSHEET</h1>
              <p>School Examination System</p>
            </div>
            <div class="student-info">
              <h3>Student Information</h3>
              <table>
                <tr><td>Name:</td><td>${studentName}</td></tr>
                <tr><td>Roll Number:</td><td>${studentData.roll_number || 'N/A'}</td></tr>
                <tr><td>Class:</td><td>${studentData.class_name || 'N/A'} - ${studentData.section || 'N/A'}</td></tr>
                <tr><td>Gender:</td><td>${studentData.gender || 'N/A'}</td></tr>
                <tr><td>Date of Birth:</td><td>${formatDate(studentData.dob)}</td></tr>
                <tr><td>Mobile:</td><td>${studentData.mobile || 'N/A'}</td></tr>
                <tr><td>Email:</td><td>${studentData.email || 'N/A'}</td></tr>
                <tr><td>Admission Date:</td><td>${formatDate(studentData.admission_date)}</td></tr>
                <tr><td>Status:</td><td>${studentData.status || 'N/A'}</td></tr>
              </table>
            </div>
            <div class="guardian-info">
              <h3>Guardian Information</h3>
              <table>
                <tr><td>Name:</td><td>${guardian.name || 'N/A'}</td></tr>
                <tr><td>Relation:</td><td>${guardian.relation || 'N/A'}</td></tr>
                <tr><td>Phone:</td><td>${guardian.phone || 'N/A'}</td></tr>
                <tr><td>Email:</td><td>${guardian.email || 'N/A'}</td></tr>
              </table>
            </div>
            <div class="footer">
              <p>This is a computer-generated marksheet. Please verify the details with school records.</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const printMarksheet = (html) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => printWindow.print()
  }

  const handlePrint = async (student) => {
    const studentId = getStudentId(student)
    if (!studentId) {
      toast({ title: 'Error', description: 'Student ID not found', variant: 'destructive' })
      return
    }

    setPrintingId(studentId)
    try {
      const response = await examinationService.printMarksheet(studentId)
      const blob = getBlobFromResponse(response)

      if (blob) {
        const text = await blob.text()
        const jsonData = JSON.parse(text)

        if (jsonData.error) {
          toast({ title: 'Error', description: jsonData.error, variant: 'destructive' })
          return
        }

        if (jsonData.success && jsonData.data) {
          printMarksheet(generateMarksheetHTML(jsonData.data))
          toast({ title: 'Success', description: 'Marksheet generated for printing' })
          return
        }

        if (jsonData.url) {
          window.open(jsonData.url, '_blank')
          toast({ title: 'Success', description: 'Marksheet opened' })
          return
        }

        if (jsonData.pdf) {
          const binaryString = window.atob(jsonData.pdf)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const blobPdf = new Blob([bytes], { type: 'application/pdf' })
          const url = window.URL.createObjectURL(blobPdf)
          window.open(url, '_blank')
          window.URL.revokeObjectURL(url)
          toast({ title: 'Success', description: 'Marksheet opened' })
          return
        }

        toast({ title: 'Success', description: jsonData.message || 'Marksheet generated' })
      } else if (response.data?.url) {
        window.open(response.data.url, '_blank')
        toast({ title: 'Success', description: 'Marksheet opened' })
      } else {
        toast({ title: 'Success', description: 'Marksheet generated' })
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to generate marksheet', variant: 'destructive' })
    } finally {
      setPrintingId(null)
    }
  }

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
        description="Search students and print marksheets for examinations."
        icon={Printer}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={refetch}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <ExportButtons
              rows={exportRows}
              columns={columnsForExport}
              filename="print-marksheet"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Students" value={stats.total} icon={FileText} accent="primary" />
        <StatCard label="Active Students" value={stats.active} icon={CheckCircle2} accent="success" />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          disabled={rawRows.length === 0}
          placeholder="Search student, roll no, or class..."
          className="max-w-sm"
        />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      ) : rawRows.length === 0 ? (
        <NoData
          icon={Printer}
          title="No Students Found"
          description="No students are available for marksheet printing."
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
