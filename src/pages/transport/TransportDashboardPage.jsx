// ====================================================================
// Module: Transport
// Page: Transport Dashboard
//
// Purpose:
// Executive overview of routes, vehicles, occupancy, and fees.
//
// Data Source:
// transport.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { Link } from 'react-router-dom'
import {
  Bus,
  Route as RouteIcon,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  MapPin,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import ChartCard from '@/components/charts/ChartCard'
import BarChartCard from '@/components/charts/BarChartCard'
import DonutChart from '@/components/charts/DonutChart'
import { useTransportStats } from '@/hooks/useTransport'
import { formatCurrency } from '@/utils/format'

const QUICK_ACTIONS = [
  { title: 'Manage Routes', to: '/transport/routes', icon: RouteIcon, desc: 'Create and edit routes' },
  { title: 'Add Vehicle', to: '/transport/vehicles', icon: Bus, desc: 'Register a new vehicle' },
  { title: 'Assign Vehicle', to: '/transport/assign-vehicle', icon: Users, desc: 'Assign students to vehicles' },
  { title: 'Transport Fees', to: '/transport/fees', icon: DollarSign, desc: 'View fee status' },
]

export default function TransportDashboardPage() {
  const { stats, routeSum, occupancy, occupancyDonut, fees, isLoading } = useTransportStats()

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Transport' }]} />
      <PageHeader
        title="Transport Dashboard"
        description="Overview of routes, vehicles, student assignments, and fee collection."
        icon={Bus}
        actions={
          <Button asChild>
            <Link to="/transport/routes">
              <RouteIcon className="mr-2 h-4 w-4" /> Manage Routes
            </Link>
          </Button>
        }
      />

      {/* KPI cards — at-a-glance snapshot of the transport operation. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Routes" value={stats?.active_routes ?? '—'} icon={RouteIcon} accent="primary" />
        <StatCard label="Total Vehicles" value={stats?.total_vehicles ?? '—'} icon={Bus} accent="chart2" />
        <StatCard label="Students Using Transport" value={stats?.students_using_transport ?? '—'} icon={Users} accent="success" />
        <StatCard label="Pending Fees" value={stats?.pending_fees ?? '—'} icon={DollarSign} accent="destructive" />
      </div>

      {/* Charts row — route distribution and vehicle occupancy. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Students per Route"
          description="Distribution of assigned students across active routes"
          action={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        >
          {isLoading ? <div className="h-[260px]" /> : <BarChartCard data={routeSum || []} color="chart-1" />}
        </ChartCard>

        <ChartCard
          title="Seat Occupancy"
          description="Occupied vs available seats"
        >
          {isLoading ? <div className="h-[260px]" /> : <DonutChart data={occupancyDonut} />}
        </ChartCard>
      </div>

      {/* Fee collection summary and route summary list. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Fee Collection Status"
          description="Breakdown of transport fee payment status"
        >
          {isLoading ? <div className="h-[240px]" /> : <DonutChart data={fees || []} />}
        </ChartCard>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Fee Collection Summary</CardTitle>
            <CardDescription>Total collected vs pending dues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-success/5 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-success">{formatCurrency(stats?.total_collected || 0)}</p>
              </div>
              <div className="rounded-xl border bg-destructive/5 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-medium text-muted-foreground">Pending Dues</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-destructive">{formatCurrency(stats?.total_pending_amount || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {stats?.pending_fees || 0} student(s) have pending or partial fee payments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions — shortcuts to the most common transport tasks. */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.title}
              to={action.to}
              className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 text-sm font-medium">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
