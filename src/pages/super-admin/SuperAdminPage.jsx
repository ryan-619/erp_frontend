// ====================================================================
// Module: Super Admin
// Page: Super Admin
//
// Purpose:
// Platform-wide overview of tenants, domains, and system health.
//
// Data Source:
// N/A
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { Building2, Globe, Users, Server, ShieldCheck, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import PageHeader from '@/components/PageHeader'
import KpiCard from '@/components/cards/KpiCard'
import ChartCard from '@/components/charts/ChartCard'
import DonutChart from '@/components/charts/DonutChart'
import BarChartCard from '@/components/charts/BarChartCard'

const TENANTS = [
  { label: 'Lincoln', value: 1240 }, { label: 'Riverside', value: 860 },
  { label: 'Greenwood', value: 2100 }, { label: 'Westfield', value: 5400 },
  { label: 'Northgate', value: 8200 },
]

const PLANS = [
  { label: 'Enterprise', value: 320, color: 'chart-1' },
  { label: 'Pro', value: 540, color: 'chart-2' },
  { label: 'Starter', value: 380, color: 'chart-3' },
]

export default function SuperAdminPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Administration' }, { label: 'Super Admin' }]} />
      <PageHeader
        title="Super Admin"
        description="Platform-wide oversight across all tenants and infrastructure."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Tenants" value={1240} icon={Building2} trend={4.2} trendLabel="this quarter" accent="primary" />
        <KpiCard label="Custom Domains" value={980} icon={Globe} trend={6.8} trendLabel="this quarter" accent="chart2" />
        <KpiCard label="Platform Users" value={8640} icon={Users} trend={8.1} trendLabel="this quarter" accent="chart4" />
        <KpiCard label="API Uptime" value="99.98%" icon={Server} trend={0.04} trendLabel="30-day avg" accent="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Top Tenants by Size" description="Largest institutions on the platform">
          <BarChartCard data={TENANTS} color="chart-4" />
        </ChartCard>
        <ChartCard title="Plan Distribution" description="Tenants by subscription plan">
          <DonutChart data={PLANS} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">System Health</CardTitle><CardDescription>Infrastructure status</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'API Gateway', status: 'Operational' },
              { name: 'Database Cluster', status: 'Operational' },
              { name: 'File Storage', status: 'Operational' },
              { name: 'Email Service', status: 'Degraded' },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <Badge variant={s.status === 'Operational' ? 'outline' : 'secondary'} className={s.status !== 'Operational' ? 'border-warning/30 bg-warning/10 text-warning' : ''}>
                  {s.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Audit Log</CardTitle><CardDescription>Recent platform events</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {[
              { t: 'Tenant created', m: 'Lincoln High School', time: '2m ago' },
              { t: 'Role updated', m: 'admin → 32 permissions', time: '18m ago' },
              { t: 'Domain verified', m: 'westfield.edu', time: '1h ago' },
              { t: 'Plan upgraded', m: 'Northgate → Enterprise', time: '3h ago' },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1"><p className="text-sm font-medium">{e.t}</p><p className="text-xs text-muted-foreground">{e.m}</p></div>
                <span className="text-xs text-muted-foreground">{e.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
