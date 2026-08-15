// ====================================================================
// Module: Attendance
// Page: Student Leave Application
//
// Purpose:
// Allow students to apply for leave and view their leave history
//
// Data Source:
// leave.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useEffect, useState } from 'react'
import { CalendarPlus, Clock, CircleCheck as CheckCircle2, Circle as XCircle, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { leaveService } from '@/services/leave.service'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const STAGE_STYLE = {
  pending: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', icon: Clock },
  approved: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', icon: CheckCircle2 },
  rejected: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', icon: XCircle },
}

function LeaveStatusPill({ status }) {
  const s = STAGE_STYLE[status] || STAGE_STYLE.pending
  const Icon = s.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', s.bg, s.text, s.border)}>
      <Icon className="h-3 w-3" />{status}
    </span>
  )
}

export default function StudentLeaveApplication() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [leaveRequests, setLeaveRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    from_date: '',
    to_date: '',
    reason: ''
  })

  // Load student's leave requests
  useEffect(() => {
    loadLeaveRequests()
  }, [])

  const loadLeaveRequests = async () => {
    setIsLoading(true)
    try {
      const data = await leaveService.getMyLeaveRequests()
      // Filter to show only this student's requests
      const myRequests = Array.isArray(data) 
        ? data.filter(req => {
            // Check if student_id matches current user
            if (typeof req.student_id === 'object') {
              return req.student_id._id === user.id || req.student_id.email === user.email
            }
            return req.student_id === user.id
          })
        : []
      setLeaveRequests(myRequests)
    } catch (error) {
      console.error('Error loading leave requests:', error)
      toast({
        title: 'Error',
        description: 'Failed to load leave requests',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate dates
    if (!formData.from_date || !formData.to_date) {
      toast({
        title: 'Validation Error',
        description: 'Please select both from and to dates',
        variant: 'destructive'
      })
      setIsSubmitting(false)
      return
    }

    if (new Date(formData.from_date) > new Date(formData.to_date)) {
      toast({
        title: 'Validation Error',
        description: 'From date cannot be after to date',
        variant: 'destructive'
      })
      setIsSubmitting(false)
      return
    }

    if (!formData.reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for leave',
        variant: 'destructive'
      })
      setIsSubmitting(false)
      return
    }

    try {
      await leaveService.applyLeave({
        student_id: user.id,
        from_date: formData.from_date,
        to_date: formData.to_date,
        reason: formData.reason
      })

      toast({
        title: 'Success',
        description: 'Leave request submitted successfully'
      })

      // Reset form
      setFormData({
        from_date: '',
        to_date: '',
        reason: ''
      })

      // Reload leave requests
      await loadLeaveRequests()
    } catch (error) {
      console.error('Error submitting leave request:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit leave request',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Attendance', to: '/attendance' }, { label: 'Apply Leave' }]} />
      <PageHeader
        title="Apply for Leave"
        description="Submit leave requests and view your leave history."
        icon={CalendarPlus}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leave Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              New Leave Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_date">From Date</Label>
                  <Input
                    id="from_date"
                    name="from_date"
                    type="date"
                    value={formData.from_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to_date">To Date</Label>
                  <Input
                    id="to_date"
                    name="to_date"
                    type="date"
                    value={formData.to_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Leave</Label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Please provide the reason for your leave request..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Leave Request'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Leave History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No leave requests yet</p>
                <p className="text-sm">Submit your first leave request using the form</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaveRequests.map((leave) => (
                  <div
                    key={leave._id}
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">
                          {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                        </p>
                        <LeaveStatusPill status={leave.status} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {leave.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Applied on: {formatDate(leave.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}