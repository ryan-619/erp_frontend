// ====================================================================
// Module: Student Portal
// Page: Student Dashboard
//
// Purpose:
// Student dashboard showing personal information and quick access
// to student-specific features.
//
// Data Source:
// studentPortal.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Calendar,
  BookOpen,
  ClipboardCheck,
  FileText,
  IndianRupee,
  Library,
  Bus,
  Award,
  Bell,
  Download,
  GraduationCap,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentPortalService } from '@/services/studentPortal.service'
import { fullName } from '@/utils/format'

const QUICK_LINKS = [
  { title: 'My Attendance', to: '/attendance/my-attendance', icon: ClipboardCheck, desc: 'View attendance record' },
  { title: 'My Profile', to: '/my-profile', icon: User, desc: 'Update personal details' },
  { title: 'My Results', to: '/examinations/my-results', icon: FileText, desc: 'View exam results' },
  { title: 'Due Fees', to: '/fees/due-fees', icon: IndianRupee, desc: 'Check fee status' },
  { title: 'My Homework', to: '/homework/my-homework', icon: BookOpen, desc: 'View assignments' },
  { title: 'My Library', to: '/library/my-library', icon: Library, desc: 'Library records' },
  { title: 'My Transport', to: '/transport/my-transport', icon: Bus, desc: 'Transport details' },
  { title: 'My Certificates', to: '/certificate/my-certificates', icon: Award, desc: 'Download certificates' },
]

export default function StudentDashboardPage() {
  const { user, role } = useAuth()
  const studentId = user?.id

  // Fetch student profile
  const { data: profile, isLoading: profileLoading } = useAsyncData(
    () => studentId ? studentPortalService.getMyProfile(studentId) : null,
    [studentId]
  )

  // Only fetch these if we have student profile data
  const studentClass = profile?.class_name || profile?.class

  // Fetch attendance stats (if API returns student-specific data)
  const { data: attendanceData, isLoading: attendanceLoading } = useAsyncData(
    () => studentId ? studentPortalService.getMyAttendance(studentId) : null,
    [studentId]
  )

  // Fetch leave requests stats
  const { data: leaveData, isLoading: leaveLoading } = useAsyncData(
    () => studentId ? studentPortalService.getMyLeaveRequests(studentId) : null,
    [studentId]
  )

  // Calculate attendance stats only if we have data
  const attendanceStats = useMemo(() => {
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return { present: 0, absent: 0, late: 0, total: 0 }
    }
    const present = attendanceData.filter(a => a.status === 'present').length
    const absent = attendanceData.filter(a => a.status === 'absent').length
    const late = attendanceData.filter(a => a.status === 'late').length
    return { present, absent, late, total: attendanceData.length }
  }, [attendanceData])

  // Calculate leave stats only if we have data
  const leaveStats = useMemo(() => {
    if (!Array.isArray(leaveData) || leaveData.length === 0) {
      return { pending: 0, approved: 0, rejected: 0, total: 0 }
    }
    const pending = leaveData.filter(l => l.status === 'pending').length
    const approved = leaveData.filter(l => l.status === 'approved').length
    const rejected = leaveData.filter(l => l.status === 'rejected').length
    return { pending, approved, rejected, total: leaveData.length }
  }, [leaveData])

  const displayName = fullName(profile?.name || user?.name)
  const studentInfo = profile || {}

  if (role !== 'student') {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            This page is only accessible to students.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Dashboard' }]} />
      <PageHeader
        title="Student Dashboard"
        description="Welcome back! Here's your personal overview."
        icon={GraduationCap}
      />

      {/* Student Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <LoadingSkeleton variant="card" rows={4} />
          ) : profile ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <p className="text-lg font-semibold">{displayName || 'Student'}</p>
                  <p className="text-sm text-muted-foreground">{studentInfo.email || user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{studentInfo.roll_number || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Class</p>
                  <p className="font-medium">{studentInfo.class_name || studentInfo.class || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Section</p>
                  <p className="font-medium">{studentInfo.section || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{studentInfo.gender || '—'}</p>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <Button asChild variant="outline">
                  <Link to="/my-profile">
                    <User className="mr-2 h-4 w-4" /> View Full Profile
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Unable to load profile information.</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Row - Only show if we have data */}
      {(attendanceStats.total > 0 || leaveStats.total > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {attendanceStats.total > 0 && (
            <>
              <StatCard
                label="Present Days"
                value={attendanceStats.present}
                icon={ClipboardCheck}
                accent="success"
              />
              <StatCard
                label="Absent Days"
                value={attendanceStats.absent}
                icon={Calendar}
                accent="destructive"
              />
            </>
          )}
          {leaveStats.total > 0 && (
            <>
              <StatCard
                label="Pending Leaves"
                value={leaveStats.pending}
                icon={Bell}
                accent="warning"
              />
              <StatCard
                label="Approved Leaves"
                value={leaveStats.approved}
                icon={ClipboardCheck}
                accent="success"
              />
            </>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.title}
              to={link.to}
              className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <link.icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 text-sm font-medium">{link.title}</p>
              <p className="text-xs text-muted-foreground">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Notice */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Some features may not be available if your profile information is incomplete. 
            Please contact administration if you see any missing data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
