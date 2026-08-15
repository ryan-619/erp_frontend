import { Award } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/context/AuthContext'

export default function MyIDCardPage() {
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Certificates' }, { label: 'My ID Card' }]} />
      <PageHeader
        title="My ID Card"
        description="View and download your student ID card."
        icon={Award}
      />
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Coming Soon</h2>
          <p className="mt-2 text-muted-foreground">ID card feature will be available soon.</p>
        </div>
      </div>
    </div>
  )
}
