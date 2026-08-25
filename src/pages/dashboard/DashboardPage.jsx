// ====================================================================
// Module: Dashboard
// Page: Dashboard
//
// Purpose:
// Central hub showing a live snapshot of the current school (tenant):
// entity KPIs, students-by-class, gender distribution, recent admissions,
// and quick actions.
//
// Data Source:
//   dashboard.service.js → GET /api/dashboard/summary  (real, live data)
// ====================================================================

import { Link } from 'react-router-dom'
import {
  BookOpen,
  GraduationCap,
  Layers,
  Library,
  UserPlus,
  Users,
  UsersRound,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import KpiCard from '@/components/cards/KpiCard'
import KpiSkeleton from '@/components/loaders/KpiSkeleton'
import ChartCard from '@/components/charts/ChartCard'
import BarChartCard from '@/components/charts/BarChartCard'
import DonutChart from '@/components/charts/DonutChart'
import { useAsyncData } from '@/hooks/useAsyncData'
import { dashboardService } from '@/services/dashboard.service'
import { formatRelativeTime } from '@/utils/format'

const QUICK_ACTIONS = [
  { title: 'Add Student', to: '/students', icon: GraduationCap, desc: 'Register a student' },
  { title: 'New Admission', to: '/students/admissions', icon: UserPlus, desc: 'Online admission' },
  { title: 'Manage Classes', to: '/academics/classes', icon: Layers, desc: 'Classes & grades' },
  { title: 'Collect Fees', to: '/fees/collect', icon: BookOpen, desc: 'Record a payment' },
]

export default function DashboardPage() {
  const { data, isLoading, error } = useAsyncData(() => dashboardService.getSummary(), [])

  const kpis = data?.kpis
  const studentsByClass = data?.studentsByClass || []
  const genderDistribution = data?.genderDistribution || []
  const recentStudents = data?.recentStudents || []

  const kpiCards = [
    { id: 'students', label: 'Total Students', value: kpis?.students ?? 0, icon: GraduationCap, accent: 'primary' },
    { id: 'staff', label: 'Staff Members', value: kpis?.staff ?? 0, icon: Users, accent: 'chart2' },
    { id: 'classes', label: 'Classes', value: kpis?.classes ?? 0, icon: Layers, accent: 'chart4' },
    { id: 'subjects', label: 'Subjects', value: kpis?.subjects ?? 0, icon: Library, accent: 'success' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Dashboard' }]} />

      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A live overview of students, staff, and academics for your school.
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-destructive">Unable to load dashboard</p>
            <p className="text-xs text-muted-foreground">{error.message || 'Please try again later.'}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
              : kpiCards.map((kpi) => (
                  <KpiCard key={kpi.id} label={kpi.label} value={kpi.value} icon={kpi.icon} accent={kpi.accent} />
                ))}
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Students by Class"
              description="Enrolment across your top classes"
              action={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            >
              {isLoading ? (
                <div className="h-[260px]" />
              ) : studentsByClass.length ? (
                <BarChartCard data={studentsByClass} color="chart-1" />
              ) : (
                <EmptyChart label="No student enrolment yet" />
              )}
            </ChartCard>

            <ChartCard title="Gender Distribution" description="Student breakdown">
              {isLoading ? (
                <div className="h-[240px]" />
              ) : genderDistribution.length ? (
                <DonutChart data={genderDistribution} />
              ) : (
                <EmptyChart label="No data yet" />
              )}
            </ChartCard>
          </div>

          {/* Recent admissions + quick actions */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent Admissions</CardTitle>
                <CardDescription>Latest students added to your school</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />
                    ))}
                  </div>
                ) : recentStudents.length ? (
                  recentStudents.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UsersRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.class_name}{s.roll_number !== '—' ? ` · Roll ${s.roll_number}` : ''}
                        </p>
                      </div>
                      {s.createdAt ? (
                        <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(s.createdAt)}</span>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">No students admitted yet.</p>
                )}
              </CardContent>
            </Card>

            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Actions</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
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
        </>
      )}
    </div>
  )
}

function EmptyChart({ label }) {
  return (
    <div className="flex h-[240px] items-center justify-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
