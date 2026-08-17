// ====================================================================
// Module: Student
// Page: My ID Card
//
// Purpose:
// Display the logged-in student's ID card(s) only.
// Filters generated ID cards by the current student's ID from auth context.
//
// Backend API: /api/certificate/generate-id-card (GET all, filter client-side)
// Schema: { student_id, design_id, generated_date }
// ====================================================================

import { Award, Download, Printer, IdCard } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { certificateService } from '@/services/certificate.service'
import { studentService } from '@/services/student.service'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Helper function to format user name (handles both string and object formats)
function formatUserName(name) {
  if (!name) return 'Student Name'
  if (typeof name === 'string') return name
  if (typeof name === 'object' && name !== null) {
    const first = name.first || ''
    const last = name.last || ''
    return `${first} ${last}`.trim() || 'Student Name'
  }
  return 'Student Name'
}

export default function MyIDCardPage() {
  const { user, role } = useAuth()
  const [idCards, setIdCards] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)
  const [studentRecord, setStudentRecord] = useState(null)

  const fetchMyIdCard = useCallback(async () => {
    if (!user?.id || role !== 'student') return

    try {
      setIsLoading(true)
      
      // First, fetch the current student's record to get the proper student._id
      // The user.id from auth might be different from the student._id in the database
      let studentId = user.id
      
      try {
        // Try to get student details using the user ID
        const studentData = await studentService.get(user.id)
        if (studentData) {
          studentId = studentData._id || studentData.id || user.id
          setStudentRecord(studentData)
        }
      } catch (error) {
        console.log('Could not fetch student details, using user.id:', error)
        // Fall back to user.id if student fetch fails
        studentId = user.id
      }
      
      // Fetch all generated ID cards and filter by the logged-in student's ID
      const data = await certificateService.getGeneratedStudentIdCards()
      const allCards = Array.isArray(data) ? data : (data?.data || [])
      
      // Filter cards that belong to this student
      const myCards = allCards.filter(card => {
        // Match by student_id (could be string or ObjectId)
        const cardStudentId = card.student_id?.toString() || card.student_id
        const currentStudentId = studentId?.toString() || studentId
        return cardStudentId === currentStudentId
      })
      
      // Sort by generated date (most recent first)
      myCards.sort((a, b) => {
        const dateA = new Date(a.generated_date || 0)
        const dateB = new Date(b.generated_date || 0)
        return dateB - dateA
      })
      
      setIdCards(myCards)
      
      // Select the most recent ID card if available
      if (myCards.length > 0) {
        setSelectedCard(myCards[0])
      }
    } catch (error) {
      console.error('Failed to fetch ID card:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, role])

  useEffect(() => {
    fetchMyIdCard()
  }, [fetchMyIdCard])

  const handleDownload = () => {
    if (selectedCard) {
      // Implementation for downloading ID card
      // This would typically generate a PDF or image
      alert('Download functionality would be implemented here')
    }
  }

  const handlePrint = () => {
    if (selectedCard) {
      window.print()
    }
  }

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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Certificates' }, { label: 'My ID Card' }]} />
        <PageHeader
          title="My ID Card"
          description="View and download your student ID card."
          icon={Award}
        />
        <LoadingSkeleton variant="card" rows={1} />
      </div>
    )
  }

  if (!selectedCard) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Certificates' }, { label: 'My ID Card' }]} />
        <PageHeader
          title="My ID Card"
          description="View and download your student ID card."
          icon={Award}
        />
        <NoData 
          title="No ID Card Generated" 
          description="Your ID card has not been generated yet. Please contact administration."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Certificates' }, { label: 'My ID Card' }]} />
      <PageHeader
        title="My ID Card"
        description="View and download your student ID card."
        icon={Award}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ID Card Display */}
        <div className="flex-1">
          <IdCardDisplay 
            card={selectedCard} 
            studentName={formatUserName(studentRecord?.name || user?.name)} 
            studentRecord={studentRecord}
          />
        </div>

        {/* Actions */}
        <div className="lg:w-64 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleDownload} className="w-full" size="sm">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button onClick={handlePrint} variant="outline" className="w-full" size="sm">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </CardContent>
          </Card>

          {idCards.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Other Cards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {idCards.slice(1).map((card, index) => (
                  <Button
                    key={card._id || index}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => setSelectedCard(card)}
                  >
                    <IdCard className="mr-2 h-4 w-4" />
                    Card {index + 2}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function IdCardDisplay({ card, studentName, studentRecord }) {
  // Use student record data if available for more accurate information
  const rollNumber = studentRecord?.roll_number || 'N/A'
  const className = studentRecord?.class_name || 'N/A'
  const section = studentRecord?.section || ''
  const classDisplay = section ? `${className} (${section})` : className

  // This is a placeholder ID card design
  // In a real implementation, this would use the template_config from the backend
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Student ID Card</CardTitle>
            <p className="text-blue-100 text-sm mt-1">Official Identification</p>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Valid
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Photo Placeholder */}
          <div className="w-32 h-40 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            {studentRecord?.student_photo ? (
              <img 
                src={studentRecord.student_photo} 
                alt="Student Photo" 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <IdCard className="h-16 w-16 text-gray-400" />
            )}
          </div>

          {/* Student Details */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Student Name</p>
              <p className="font-semibold text-lg">{studentName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="font-medium">{rollNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{classDisplay}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Card ID</p>
                <p className="font-medium text-xs">{card._id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Generated Date</p>
                <p className="font-medium">
                  {card.generated_date ? new Date(card.generated_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>This card is the property of the educational institution</p>
            <p>If found, please return to the school office</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
