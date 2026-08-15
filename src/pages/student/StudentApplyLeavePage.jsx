import { Calendar } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/context/AuthContext'

export default function StudentApplyLeavePage() {
  const { role } = useAuth()

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
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Attendance' }, { label: 'Apply Leave' }]} />
      <PageHeader
        title="Apply Leave"
        description="Submit a leave request."
        icon={Calendar}
      />
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Coming Soon</h2>
          <p className="mt-2 text-muted-foreground">Leave application feature will be available soon.</p>
        </div>
      </div>
    </div>
  )
}
