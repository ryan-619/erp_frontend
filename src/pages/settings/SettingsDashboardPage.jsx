// ====================================================================
// Module: Settings
// Page: Settings Dashboard
//
// Purpose:
// Overview of all settings sub-modules with KPIs and recent updates.
//
// Data Source:
// settings.service.js (via useSettingsStats)
// ====================================================================

import { CalendarClock, ShieldCheck, Users, DollarSign, Languages, Boxes, Settings } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useSettingsStats } from '@/hooks/useSettings'
import { formatRelativeTime } from '@/utils/format'

const RECENT_UPDATES = [
  { label: 'General settings updated', time: '2025-01-15T10:30:00Z' },
  { label: 'New session 2024-2025 marked current', time: '2025-01-14T09:15:00Z' },
  { label: 'Role "Accountant" permissions modified', time: '2025-01-13T14:45:00Z' },
  { label: 'Currency INR set as base', time: '2025-01-12T11:20:00Z' },
  { label: 'Module "Inventory" disabled', time: '2025-01-11T16:00:00Z' },
]

export default function SettingsDashboardPage() {
  const { stats, isLoading } = useSettingsStats()

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'Dashboard' }]} />
      <PageHeader
        title="Settings Dashboard"
        description="Overview of system configuration and preferences."
        icon={Settings}
      />

      {isLoading ? (
        <LoadingSkeleton variant="cards" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Sessions" value={stats.total_sessions} icon={CalendarClock} accent="primary" />
          <StatCard label="Active Sessions" value={stats.active_sessions} icon={CalendarClock} accent="success" />
          <StatCard label="Roles" value={stats.total_roles} icon={ShieldCheck} accent="chart2" />
          <StatCard label="Users" value={stats.total_users} icon={Users} accent="success" />
          <StatCard label="Currencies" value={stats.total_currencies} icon={DollarSign} accent="warning" />
          <StatCard label="Languages" value={stats.total_languages} icon={Languages} accent="chart3" />
          <StatCard label="Enabled Modules" value={stats.enabled_modules} icon={Boxes} accent="chart4" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Updates</CardTitle>
          <CardDescription>Latest configuration changes across the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {RECENT_UPDATES.map((u, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">{u.label}</span>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(u.time)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
