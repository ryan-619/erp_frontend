// ====================================================================
// Module: Student Portal
// Page: My Profile
//
// Purpose:
// Student can view and update their personal profile information.
//
// Data Source:
// studentPortal.service.js
// ====================================================================

import { useMemo, useState } from 'react'
import { User, Mail, Phone, Calendar, MapPin, GraduationCap, Bus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'
import { studentPortalService } from '@/services/studentPortal.service'
import { transportService } from '@/services/transport.service'
import { hostelService } from '@/services/hostel.service'
import { fullName, formatDate } from '@/utils/format'

export default function MyProfilePage() {
  const { user, role } = useAuth()
  const { toast } = useToast()
  const studentId = user?.id

  const { data: profile, isLoading, refetch } = useAsyncData(
    () => studentId ? studentPortalService.getMyProfile(studentId) : null,
    [studentId]
  )

  // Fetch transport routes and hostels for lookup
  const { data: transportRoutes } = useAsyncData(
    () => transportService.getTransportRoutes(),
    []
  )

  const { data: hostels } = useAsyncData(
    () => hostelService.getHostels(),
    []
  )

  // Create lookup maps
  const routeMap = useMemo(() => {
    const map = {}
    if (Array.isArray(transportRoutes)) {
      transportRoutes.forEach(route => {
        map[route._id] = route.route_name || route.name || route.route
      })
    }
    return map
  }, [transportRoutes])

  const hostelMap = useMemo(() => {
    const map = {}
    if (Array.isArray(hostels)) {
      hostels.forEach(hostel => {
        map[hostel._id] = hostel.hostel_name || hostel.name || hostel.hostel
      })
    }
    return map
  }, [hostels])

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    mobile: '',
    email: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
  })

  const studentInfo = profile || {}
  const displayName = fullName(studentInfo.name || user?.name)

  const handleEdit = () => {
    setForm({
      mobile: studentInfo.mobile || '',
      email: studentInfo.email || user?.email || '',
      guardian_name: studentInfo.guardian?.name || '',
      guardian_phone: studentInfo.guardian?.phone || '',
      guardian_email: studentInfo.guardian?.email || '',
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      await studentPortalService.updateMyProfile(studentId, {
        mobile: form.mobile,
        email: form.email,
        guardian: {
          name: form.guardian_name,
          phone: form.guardian_phone,
          email: form.guardian_email,
        },
      })
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
      setIsEditing(false)
      refetch()
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error?.response?.data?.message || 'Unable to update profile',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'My Profile' }]} />
      <PageHeader
        title="My Profile"
        description="View and update your personal information."
        icon={User}
        actions={
          !isEditing && (
            <Button onClick={handleEdit}>
              Edit Profile
            </Button>
          )
        }
      />

      {isLoading ? (
        <LoadingSkeleton variant="card" rows={8} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-bold">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <p className="text-xl font-semibold">{displayName || 'Student'}</p>
                  <p className="text-sm text-muted-foreground">Student</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Roll Number</Label>
                  <p className="font-medium">{studentInfo.roll_number || '—'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Class</Label>
                  <p className="font-medium">{studentInfo.class_name || studentInfo.class || '—'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Section</Label>
                  <p className="font-medium">{studentInfo.section || '—'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  <p className="font-medium capitalize">{studentInfo.gender || '—'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                  <p className="font-medium">{formatDate(studentInfo.dob)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Blood Group</Label>
                  <p className="font-medium">{studentInfo.blood_group || '—'}</p>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3 pt-4 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs">Mobile</Label>
                    <Input
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mobile</p>
                      <p className="font-medium">{studentInfo.mobile || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{studentInfo.email || user?.email || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card>
            <CardHeader>
              <CardTitle>Guardian Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Guardian Name</Label>
                    <Input
                      value={form.guardian_name}
                      onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                      placeholder="Enter guardian name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Guardian Phone</Label>
                    <Input
                      value={form.guardian_phone}
                      onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                      placeholder="Enter guardian phone"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Guardian Email</Label>
                    <Input
                      type="email"
                      value={form.guardian_email}
                      onChange={(e) => setForm({ ...form, guardian_email: e.target.value })}
                      placeholder="Enter guardian email"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium">{studentInfo.guardian?.name || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{studentInfo.guardian?.phone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{studentInfo.guardian?.email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">{studentInfo.guardian?.address || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Occupation</p>
                      <p className="font-medium">{studentInfo.guardian?.occupation || '—'}</p>
                    </div>
                  </div>
                </>
              )}

              {isEditing && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transport & Hostel (Read-only) */}
          {(studentInfo.transport || studentInfo.hostel) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {studentInfo.transport && (
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Bus className="h-4 w-4" /> Transport
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Route</p>
                          <p>{routeMap[studentInfo.transport.route_id] || studentInfo.transport.route_id || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pickup Point</p>
                          <p>{studentInfo.transport.pickup_point || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {studentInfo.hostel && (
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Hostel
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Hostel</p>
                          <p>{hostelMap[studentInfo.hostel.hostel_id] || studentInfo.hostel.hostel_id || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Room Number</p>
                          <p>{studentInfo.hostel.room_no || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
