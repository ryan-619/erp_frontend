// ====================================================================
// Module: Profile
// Page: Profile
//
// Purpose:
// View and edit the current user's profile information.
//
// Data Source:
// N/A
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { Mail, Phone, MapPin, Calendar, Shield, CreditCard as Edit, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import PageHeader from '@/components/PageHeader'
import RoleBadge from '@/components/common/RoleBadge'
import { useAuth } from '@/context/AuthContext'
import { initials, fullName, formatDate } from '@/utils/format'

export default function ProfilePage() {
  const { user } = useAuth()
  
  if (!user) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Profile' }]} />
        <PageHeader title="My Profile" description="View and update your personal information." />
        <div className="text-center py-12 text-muted-foreground">Please log in to view your profile</div>
      </div>
    )
  }
  
  const name = fullName(user?.name) || ''
  const email = user?.email || ''
  const role = user?.role || ''
  
  // Parse name object for first/last name inputs
  const firstName = typeof user?.name === 'object' ? user.name.first : (user?.name || '').split(' ')[0] || ''
  const lastName = typeof user?.name === 'object' ? user.name.last : (user?.name || '').split(' ').slice(1).join(' ') || ''

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Profile' }]} />
      <PageHeader title="My Profile" description="View and update your personal information." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Summary */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="relative mx-auto w-fit">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {initials(name)}
              </div>
              <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-4 text-lg font-bold">{name}</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
            <div className="mt-3 flex justify-center"><RoleBadge role={role} /></div>
            <div className="mt-6 space-y-3 text-left text-sm">
              <div className="flex items-center gap-3 text-muted-foreground"><Mail className="h-4 w-4" /> {email || '—'}</div>
              <div className="flex items-center gap-3 text-muted-foreground"><Phone className="h-4 w-4" /> {user?.mobile || '—'}</div>
              <div className="flex items-center gap-3 text-muted-foreground"><MapPin className="h-4 w-4" /> {user?.address || '—'}</div>
              <div className="flex items-center gap-3 text-muted-foreground"><Calendar className="h-4 w-4" /> {user?.admission_date ? formatDate(user.admission_date) : '—'}</div>
              <div className="flex items-center gap-3 text-muted-foreground"><Shield className="h-4 w-4" /> {user?.status || 'active'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle className="text-base">Personal Information</CardTitle><CardDescription>Update your account details.</CardDescription></div>
              <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="fn">First name</Label><Input id="fn" defaultValue={firstName} /></div>
            <div className="space-y-2"><Label htmlFor="ln">Last name</Label><Input id="ln" defaultValue={lastName} /></div>
            <div className="space-y-2"><Label htmlFor="em">Email</Label><Input id="em" type="email" defaultValue={email} /></div>
            <div className="space-y-2"><Label htmlFor="ph">Phone</Label><Input id="ph" defaultValue={user?.mobile || ''} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="bio">Bio</Label><Input id="bio" placeholder="Tell us about yourself" defaultValue={user?.bio || ''} /></div>
            <div className="space-y-2"><Label htmlFor="role">Role</Label><Input id="role" disabled defaultValue={role} /></div>
            <div className="space-y-2"><Label htmlFor="inst">Institution</Label><Input id="inst" disabled defaultValue={user?.class_name || ''} /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
